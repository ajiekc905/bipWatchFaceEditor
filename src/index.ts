import fileOpen from './fileops';
document.addEventListener('DOMContentLoaded', function() {
  let openFileButton = document.getElementById('fileSelector');
  openFileButton.addEventListener('change', fileOpen);
});
