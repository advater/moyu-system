import SparkMD5 from "spark-md5";

type HashResult = {
  index: number;
  hash: string;
  start: number;
  end: number;
};

function hashIndex(file: File, index: number, chunkSize: number): Promise<HashResult> {
  return new Promise((resolve, reject) => {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const result = e.target?.result;
      if (!result) {
        reject(new Error("empty chunk"));
        return;
      }
      spark.append(result as ArrayBuffer);
      resolve({ index, hash: spark.end(), start, end });
    };
    fileReader.onerror = (err) => reject(err);
    fileReader.readAsArrayBuffer(file.slice(start, end));
  });
}

self.onmessage = async (e: MessageEvent<{
  file: File;
  chunkSize: number;
  startChunkIndex: number;
  endChunkIndex: number;
}>) => {
  const { file, chunkSize, startChunkIndex, endChunkIndex } = e.data;
  const hashes: HashResult[] = [];
  for (let i = startChunkIndex; i < endChunkIndex; i++) {
    hashes.push(await hashIndex(file, i, chunkSize));
  }
  postMessage(hashes);
};
