export default function() {
  let c = <HTMLCanvasElement>document.getElementById('myCanvas');
  let output = document.getElementById('list');
  var ctx: CanvasRenderingContext2D = c.getContext('2d');
  ctx.moveTo(0, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
}
