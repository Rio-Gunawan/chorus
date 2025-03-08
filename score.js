const correct_password = "438089f5";

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

$(function () {
    // ページ読み込み時にCookieをチェック
    if (getCookie("authenticated") === "true") {
        $(".password_screen").addClass("hide");
    }

    // パスワードの正誤判定
    $("#check").on("click", function () {
        let password = $("#password_input").val();

        password = password.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        password = password.replace(/\s+/g, "");
        if (correct_password === password) {
            $(".password_screen").addClass("hide");
            setCookie("authenticated", "true", 14); // 認証成功をCookieに保存（14日間有効）
        } else {
            $('.password_mismatch').show();
        }
    });

    // エンターキーで正誤判定を行う
    $("input[type=text]").on('keyup', function (e) {
        if (e.key === 'Enter') {
            $('#check').trigger('click');
        }
    });

    // パスワード欄を変更したら、エラーメッセージを削除
    $("#password_input").on("input", function () {
        $('.password_mismatch').hide();
    });
});