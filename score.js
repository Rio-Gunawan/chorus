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

// 文字列を正規化する関数
function normalizeString(str) {
    // 全角英数字を半角に変換
    str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    // 前後の空白を削除
    str = str.trim();
    return str;
}

function checkPassword() {
    let password = document.getElementById("password_input").value;

    password = normalizeString(password);
    if (correct_password === password) {
        document.querySelector(".password_screen").style.display = "none";
        setCookie("authenticated", "true", 14); // 認証成功をCookieに保存（14日間有効）
    } else {
        document.querySelector('.password_mismatch').style.display = "block";
    }
}

$(function () {
    // ページ読み込み時にCookieをチェック
    if (getCookie("authenticated") === "true") {
        $(".password_screen").addClass("hide");
    }

    // パスワードの正誤判定
    $("#check").on("click", function () {
        checkPassword();
    });

    // エンターキーで正誤判定を行う
    $("input[type=text]").on('keyup', function () {
        checkPassword();
    });

    // パスワード欄を変更したら、エラーメッセージを削除
    $("#password_input").on("input", function () {
        $('.password_mismatch').hide();
    });
});