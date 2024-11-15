(function ($) {

  $(".toggle-password").click(function () {

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
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const re_password = document.getElementById('re_password').value;

  document.querySelectorAll('.error-message').forEach(error => {
    error.style.display = 'none';
  });

  let hasError = false;

  // Kiểm tra từng trường nhập
  if (!name) {
    document.getElementById('nameError').style.display = 'block';
    hasError = true;
  }

  if (!email) {
    document.getElementById('emailError').style.display = 'block';
    hasError = true;
  }

  if (!password) {
    document.getElementById('passwordError').style.display = 'block';
    hasError = true;
  }

  if (!re_password) {
    document.getElementById('rePasswordError').style.display = 'block';
    hasError = true;
  }

  // Kiểm tra nếu mật khẩu không khớp
  if (password && re_password && password !== re_password) {
    document.getElementById('matchPasswordError').style.display = 'block';
    hasError = true;
  }

  // Ngăn form gửi nếu có lỗi
  if (hasError) {
    event.preventDefault();
  }

  const userData = {
    name,
    email,
    password,
    re_password
  };

  ipcRenderer.send('register-form-submit', userData);

});