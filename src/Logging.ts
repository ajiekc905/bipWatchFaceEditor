export class Logging {
  clear () {
    let list = document.getElementById('list');
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  }

  add (data: any, type = 1) {
    // type = type === undefined ? 1 : type;
    let li = document.createElement('li');
    let pre = document.createElement('pre');
    li.appendChild(pre);
    var textNode = document.createTextNode(data);
    pre.appendChild(textNode);
    let list = document.getElementById('list');
    list.appendChild(li);
  }
}
