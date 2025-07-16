import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Article, AttributionResult } from '../../shared/types';

export class FileUtils {
  
  // Import des articles depuis un fichier Excel ou CSV
  static async importArticles(file: File): Promise<string[]> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return this.importFromCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return this.importFromExcel(file);
    } else {
      throw new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
    }
  }

  private static async importFromCSV(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const articles = this.extractArticlesFromData(results.data);
            resolve(articles);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`Erreur lors de la lecture du CSV: ${error.message}`));
        }
      });
    });
  }

  private static async importFromExcel(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Prendre la première feuille
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Extraire les articles
          const articles = this.extractArticlesFromRows(jsonData);
          resolve(articles);
        } catch (error) {
          reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  private static extractArticlesFromData(data: any[]): string[] {
    const articles: string[] = [];
    
    for (const row of data) {
      // Chercher dans toutes les colonnes possibles
      const article = row.article || row.libelle || row.designation || row.nom || row.produit;
      
      if (article && typeof article === 'string' && article.trim()) {
        articles.push(article.trim());
      }
    }
    
    if (articles.length === 0) {
      throw new Error('Aucun article trouvé. Vérifiez que votre fichier contient une colonne "article", "libelle", "designation", "nom" ou "produit"');
    }
    
    return articles;
  }

  private static extractArticlesFromRows(rows: any[][]): string[] {
    const articles: string[] = [];
    
    if (rows.length === 0) {
      throw new Error('Le fichier est vide');
    }
    
    // Si la première ligne contient des en-têtes textuels, on la skip
    const startRow = this.hasHeaders(rows[0]) ? 1 : 0;
    
    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (row && row.length > 0) {
        // Prendre la première cellule non vide
        for (const cell of row) {
          if (cell && typeof cell === 'string' && cell.trim()) {
            articles.push(cell.trim());
            break;
          }
        }
      }
    }
    
    if (articles.length === 0) {
      throw new Error('Aucun article trouvé dans le fichier');
    }
    
    return articles;
  }

  private static hasHeaders(firstRow: any[]): boolean {
    if (!firstRow || firstRow.length === 0) return false;
    
    const headerTerms = ['article', 'libelle', 'designation', 'nom', 'produit', 'description'];
    const firstCell = String(firstRow[0]).toLowerCase();
    
    return headerTerms.some(term => firstCell.includes(term));
  }

  // Export des résultats vers Excel
  static exportToExcel(results: AttributionResult[], filename: string = 'attribution_secteurs'): void {
    const data = results.map(result => ({
      'Article': result.article,
      'Code Secteur': result.secteurCode,
      'Libellé Secteur': result.secteurLibelle,
      'Confiance': `${Math.round(result.confidence * 100)}%`,
      'Raisonnement': result.reasoning || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 40 }, // Article
      { wch: 15 }, // Code Secteur
      { wch: 30 }, // Libellé Secteur
      { wch: 12 }, // Confiance
      { wch: 50 }  // Raisonnement
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attribution Secteurs');
    
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
  }

  // Export vers CSV
  static exportToCSV(results: AttributionResult[], filename: string = 'attribution_secteurs'): void {
    const data = results.map(result => ({
      'Article': result.article,
      'Code Secteur': result.secteurCode,
      'Libellé Secteur': result.secteurLibelle,
      'Confiance': `${Math.round(result.confidence * 100)}%`,
      'Raisonnement': result.reasoning || ''
    }));

    const csv = Papa.unparse(data, {
      delimiter: ';',
      header: true
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Valider le format d'un fichier
  static validateFile(file: File): boolean {
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return false;
    }
    
    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    return file.size <= maxSize;
  }
}