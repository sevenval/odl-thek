/*jslint unparam: true, plusplus: true, nomen: true, indent: 2 */
/*global $, document, window */

function bookNow() {
  'use strict';
  var book = $('#book');
  $.post(book.attr('action'), book.serialize(), function (_content) {
    $('#bookingModal .modal-content').html(_content);
  });
}

$(function () {
  'use strict';

  $('#filter input[type="checkbox"]').change(function (e) {
    $(e.target).closest('form').submit();
  });

  $('.copy-href').click(function (e) {
    $($(this).data('target') + ' .modal-footer a').attr('href', $(this).data('href'));
    $($(this).data('target')).modal('show');
    return false;
  });

  $('body').on('hidden.bs.modal', '.modal', function () {
    $(this).removeData('bs.modal');
  });

  $('.gadet-entry').mouseover(function (e) {
    $(this).addClass('showDetails');
  });

  $('.gadet-entry').mouseout(function (e) {
    $(this).removeClass('showDetails');
  });

  $('#bookingModal').on('hidden.bs.modal', function () {
    if (window.location.pathname !== '/gadgets' && window.location.pathname !== '/gadgets/') {
      // reload current page on booking modal close
      window.location.reload(true);
    }
  });

  $(document).on('click', '.load-more', function () {
    var btn = $(this);
    btn.button('loading');
    $.get($(this).attr('href'), function (data) {
      btn.closest('table').append(data);
      btn.closest('tr').remove();
    });
    return false;
  });

});