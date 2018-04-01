import { Storage } from './Storage';
import { Logging } from './Logging';
import BinFileReader from './Binary';
export default function(event: any) {
  let storage = new Storage();
  var input = event.target;
  let log = new Logging();

  var reader = new FileReader();
  reader.onload = function() {
    let arrayBuffer = reader.result;
    let b = new BinFileReader(arrayBuffer);
    log.clear()
    // log.add(b.toJSON());
    // log.add(b.toYAML());
  };
  reader.readAsArrayBuffer(input.files[0]);
}
