type TCrop = {
  x: number;
  y: number;
  cutWidth: number;
  cutHeight: number;
  width: number;
  height: number;
  fileName: string;
  fileType: string;
};

export function fileToBlob(file: File): string {
  return window.URL.createObjectURL(file);
}

export function blobToFile(
  blob: Blob,
  fileName = "file",
  mimeType = "image/jpeg",
): File {
  return new File([blob], fileName, { type: mimeType });
}

export function fileToBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || null);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

export function imgURLToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

export function base64toFile(dataURL: string, fileName = "file"): File {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "";
  const suffix = mime.split("/")[1];
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], `${fileName}.${suffix}`, { type: mime });
}

export function base64ToHex(dataURL: string): string {
  const arr = dataURL.split(",");
  const raw = atob(arr[1]);
  let hex = "";
  for (let i = 0; i < raw.length; i++) {
    const part = raw.charCodeAt(i).toString(16);
    hex += part.length === 2 ? part : `0${part}`;
  }
  return hex.toUpperCase();
}

export function hexToFile(
  hex: string,
  fileName = "file",
  mimeType = "image/jpeg",
): File {
  const bytes = hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [];
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

export function readFormFile(): Promise<string> {
  return new Promise((res, rej) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => res(e.target.result);
      fileReader.onerror = (e) => rej(e);
      fileReader.readAsText(file);
    };
    fileInput.click();
  });
}

export function cropImage(img: HTMLImageElement, cropInfo: Partial<TCrop>): Promise<File> {
  return new Promise((resolve, reject) => {
    const cutInfo: TCrop = {
      x: 0,
      y: 0,
      cutWidth: img.width,
      cutHeight: img.height,
      width: img.width,
      height: img.height,
      fileName: "avatar.png",
      fileType: "image/png",
      ...cropInfo,
    };
    const canvas = document.createElement("canvas");
    canvas.width = cutInfo.width;
    canvas.height = cutInfo.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("无法创建 canvas"));
      return;
    }
    ctx.drawImage(
      img,
      cutInfo.x,
      cutInfo.y,
      cutInfo.cutWidth,
      cutInfo.cutHeight,
      0,
      0,
      cutInfo.width,
      cutInfo.height,
    );
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("裁剪失败，请检查参数"));
        return;
      }
      resolve(new File([blob], cutInfo.fileName, { type: cutInfo.fileType }));
    }, cutInfo.fileType);
  });
}

export async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Failed to compress image"))),
          file.type,
          quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

const vFile = {
  readFormFile,
  fileToBlob,
  blobToFile,
  fileToBase64,
  imgURLToBase64,
  base64toFile,
  base64ToHex,
  hexToFile,
  readImage: fileToBase64,
  cropImage,
  compressImage,
};

export default vFile;
