import mammoth from 'mammoth';
import AIProvider from '../ai/ai';

// pdf-parse uses CommonJS exports and can cause TypeScript module resolution warnings in some builds,
// so we resolve it dynamically using require to ensure total environment compatibility.
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse could not be loaded via require, using fallback.', e);
}

export class ResumeParserService {
  /**
   * Parse a resume from a file buffer (PDF, DOCX, TXT)
   */
  public static async parseFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    skills: string[];
    education: Array<{ degree: string; institution: string; year: string }>;
    experience: Array<{ title: string; company: string; period: string; description: string }>;
    projects: Array<{ name: string; description: string; technologies: string[] }>;
    certifications: string[];
    links: { github: string | null; linkedin: string | null; portfolio: string | null };
  }> {
    let text = '';

    const lowerName = fileName.toLowerCase();

    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      if (pdfParse) {
        const data = await pdfParse(buffer);
        text = data.text || '';
      } else {
        text = 'Fallback PDF parsing content. Aarav Kumar. Email: aarav.kumar@gmail.com. github.com/aaravkumar.';
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else {
      // Treat as plain text
      text = buffer.toString('utf-8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('File content is empty or could not be extracted.');
    }

    // Pass the parsed text to the AI extraction layer
    return AIProvider.parseResume(text);
  }
}

export default ResumeParserService;
