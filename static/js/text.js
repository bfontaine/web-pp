(function(){
    var a = document.getElementsByClassName('ascii')[0];

    if ( a ) {
      a.innerHTML = a.innerHTML.replace(/'/g, '’');
    }
})();
