function openBookingLayer(_url) {
  $.ajax({
    url: _url
  }).done(function(_content) {
    console.log(_content);
    $( '#layer' ).html(_content);
    $('#layer').show();
  });
}

function bookNow() {
  var book = $('#book');
  console.log(book)
  $.post(book.attr('action'),book.serialize(),function(_content){
    $('#layer').html(_content);
    $('#layer').show();
  });
}