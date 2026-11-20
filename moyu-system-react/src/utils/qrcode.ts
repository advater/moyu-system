import qrcode from "qrcode";

type TOptions = {
  text: string;
  width: number;
  height: number;
  colorDark: string;
  colorLight: string;
  correctLevel: string;
};

class QRCode {
  text = "";
  opts = {};
  width = 150;
  height = 150;
  constructor({
    text,
    width,
    height,
    colorDark,
    colorLight,
    correctLevel,
  }: TOptions) {
    this.text = text;
    this.opts = {
      errorCorrectionLevel: correctLevel || "L",
      color: {
        dark: colorDark || "#000",
        light: colorLight || "#fff",
      },
    };
    this.width = width;
    this.height = height;
  }
  // 获取二维码url
  getCodeUrl() {
    return new Promise((resolve, reject) => {
      qrcode
        .toDataURL(this.text, this.opts)
        .then((url: string) => {
          resolve(url);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }
}

export default QRCode;
