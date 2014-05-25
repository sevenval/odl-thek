function openBookingLayer(_url) {
  $.ajax({
    url: _url
  }).done(function(_content) {
    console.log(_content);
    $( '#layerBookGadget' ).html(_content);
    $('#layerBookGadget').show();
  });
}

function bookNow() {
  var book = $('#book');
  console.log(book)
  $.post(book.attr('action'),book.serialize(),function(_content){
    $('#layerBookGadget').html(_content);
    $('#layerBookGadget').show();
  });
}

