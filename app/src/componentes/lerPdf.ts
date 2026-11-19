// Extrai o texto de um PDF no navegador (pdf.js). O arquivo não sai da máquina de quem está usando.
export async function textoDoPdf(arquivo: File | ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const dados = arquivo instanceof ArrayBuffer ? arquivo : await arquivo.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(dados) }).promise;
  const paginas: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const conteudo = await (await doc.getPage(n)).getTextContent();
    paginas.push(conteudo.items.map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : "")).join(""));
  }
  return paginas.join("\n");
}
