import { Reader } from "./DataHelper";
import { Logging } from "./Logging";

export default class RawImage {
  // palette: Uint32Array;
  public width: number;
  public height: number;
  public usdedPaletteColors: number;
  public name: string;
  // private section for stupid linter
  private palette: ImageData[]; // colored pixels imagedata
  private  pos: number;
  private rowLengthInBytes: number;
  private bitsPerPixel: number;
  private hasTransparency: number;
  private urlEncodedImage: string;
  private rawData: Uint8Array;

  constructor(array: Uint8Array, name: string = "000") {
    const readWord = new Reader(array, 0, 16);
    const magic: string = readWord.stringNt();
    if (magic !== "BMd") {
      throw new Error("this is not image!!!");
    }

    this.name = "i" + ("000" + name).slice(-3);
    readWord.move(4);
    this.width = readWord.next(); // 176
    this.height = readWord.next(); // 176
    this.rowLengthInBytes = readWord.next();
    this.bitsPerPixel = readWord.next(); // 04
    this.usdedPaletteColors = readWord.next(); // 07
    this.hasTransparency = readWord.next();

    this.infoToLog();
    const rawImageStart = this.paletteReader(array);
    const rawByteSize = this.rowLengthInBytes * this.height;
    // console.log(`image starts at ${rawImageStart.toString(16)} and size is ${rawByteSize.toString(16)}`)
    this.rawData = array.slice(rawImageStart);
    this.readImage(this.rawData, 0, rawByteSize);
    this.putCanvasToImg();
  }

  public encode() {
    // the output would be Uint8Array ready to merge into binary blob
    // steps: write header
    // write palette from ours   .palette
    // just dump image data from .rawData
    const header: Uint8Array = new Uint8Array(0x1f);
  }

  public logger(message: string) {
    const log = new Logging();
    log.add(message);
    console.log(message);
  }

  public infoToLog() {
    console.log(
      `${this.name}: ${this.width} x ${this.height}, ${
        this.bitsPerPixel
      }bpp, palette size: ${this.usdedPaletteColors}, t:${this.hasTransparency}`
      // , bytes per line: ${
      // this.rowLengthInBytes
      // }, calculated width:${this.rowLengthInBytes * 8 / this.bitsPerPixel}
    );
  }
  public paletteToImage() {
    const width = 32;
    const canvas = document.createElement("canvas");
    canvas.width = width * this.palette.length;
    canvas.height = width;
    const context = canvas.getContext("2d");

    const colors = this.palette.length;
    for (let idx = 0; idx < colors; idx++) {
      const imgData = this.palette[idx];
      for (let y = 0; y < width; y++) {
        for (let x = 0; x < width; x++) {
          const posX = (idx << 5) + x;
          context.putImageData(imgData, x, y);
        }
      }
    }
    const imgsrc = canvas.toDataURL();
    return imgsrc;
  }

  public putCanvasToImg(imgSrc: string = "") {
    const preview = document.getElementsByClassName("preview")[0];
    // let canvas = document.getElementById("myCanvas");
    // let image = canvas.toDataURL();
    const img = document.createElement("img");

    img.src = "" === imgSrc ? this.urlEncodedImage : imgSrc;
    // img.width = this.width;
    // img.height = this.height;
    img.id = this.name;
    img.title = this.name;

    preview.appendChild(img);
  }

  private readImage(array: Uint8Array, start: number, size: number) {
    // let canvas: HTMLCanvasElement = document.createElement("canvas");
    // canvas.width = this.rowLengthInBytes * 8 / this.bitsPerPixel
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const context = canvas.getContext("2d");
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const readBits = new Reader(array, start, this.bitsPerPixel);
    const xBaseShift: number = 8 / this.bitsPerPixel;
    // the original picture has width / bitsPerPixel
    // image to view has no such restrictions

    for (let y: number = 0; y < this.height; y++) {
      ///// bp = byte pos in raw image data line.
      for (let bp: number = 0; bp < this.rowLengthInBytes; bp++) {
        const bitData: number[] = readBits.next();
        let nibbleShift: number = 0;
        const bp_X_xBaseShift: number = bp * xBaseShift;
        if (bitData) {
          bitData.forEach(
            (paletteIndex) => {
              // console.log(paletteIndex);
              const x = bp_X_xBaseShift + nibbleShift;
              // we expect in palette 1pixel imagedata
              const pixelImgData = this.palette[paletteIndex];
              //     // console.log(pixelImgData)
              if (pixelImgData) {
                context.putImageData(pixelImgData, x, y);
              }
              nibbleShift++;
            } // foreach {}
          ); // foreach
        }
      } // for bp
    } // for y

    this.urlEncodedImage = canvas.toDataURL();
    // png.
  }

  private colorTo1pixImgdata(color: number): ImageData {
    console.log(color);
    this.logger(color.toString(16))
    const onePixCanvas = document.createElement("canvas");
    onePixCanvas.width = 1;
    onePixCanvas.height = 1;
    const onePixContext = onePixCanvas.getContext("2d");
    const onePixData = onePixContext.getImageData(0, 0, 1, 1);
    const onePix32b = new Uint32Array(onePixData.data.buffer);
    // onePix32b[0] = color;
    onePix32b[0] = 0xff000000 | color;
    return onePixData
  }

  private  paletteReader(rawImgData: Uint8Array) {
    const rawPaletteStart = 0x10;
    const colors = new Reader(rawImgData, rawPaletteStart , 8);
    const log = new Logging()

    log.add("paletteReader")
    console.log("paletteReader");
    // console.log(`transparency: ${this.transp}`);
    this.palette = [];
    let color: number = 0
    for (let index = 0; index < this.usdedPaletteColors; index++) {
      const red = colors.next()
      const green = colors.next()
      const blue = colors.next()
      const spacer = colors.next()
      if (index === 0 && this.hasTransparency) {
        color = 0; // transparent
      } else {
        // let addr = rawPaletteStart + (index << 2);
        // color = colors.next() | 0xff000000; // non transp pixels

        color = red | green << 8 | blue << 16

        this.palette[index] = this.colorTo1pixImgdata(color);
        console.log(`palette:${index} = ${color}`);
      }
    }
    console.log(JSON.stringify(this.palette));
    console.log("----- paletteReader");
    return rawPaletteStart + (this.usdedPaletteColors << 2);
  }

}
