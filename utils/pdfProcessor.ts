// PDF.js loaded via script tag (index.html) exposes window.pdfjsLib
const getPdfLib = () => {
  const lib = (typeof window !== 'undefined' && (window as any).pdfjsLib) || (typeof window !== 'undefined' && (window as any)['pdfjs-dist/build/pdf']);
  if (!lib) throw new Error('PDF.js not loaded. Ensure the script is included in index.html.');
  return lib;
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = getPdfLib();
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => (item as any).str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
};
