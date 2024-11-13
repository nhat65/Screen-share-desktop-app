(function($) {

  $(".toggle-password").click(function() {

      $(this).toggleClass("zmdi-eye zmdi-eye-off");
      var input = $($(this).attr("toggle"));
      if (input.attr("type") == "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });

})(jQuery);

const { ipcRenderer } = require('electron');

document.getElementById("submit").addEventListener("click", (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const re_password = document.getElementById('re_password').value

  const userData = {
    name,
    email,
    password,
    re_password
  };

  ipcRenderer.send('register-form-submit', userData);

});