const correct_password = "438089f5";

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let c of ca) {
        c = c.trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
}

// 文字列を正規化する関数
function normalizeString(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).trim();
}

function checkPassword() {
    const password = normalizeString($("#password_input").val());
    if (correct_password === password) {
        $(".password_screen").addClass("hide");
        setCookie("authenticated", "true", 14);
    } else {
        $('.password_mismatch').show();
    }
}

$(function () {
    // ページ読み込み時にCookieをチェック
    if (getCookie("authenticated") === "true") {
        $(".password_screen").addClass("hide");
    }

    $("#check").on("click", checkPassword);
    $("input[type=password]").on('keyup', function (e) {
        if (e.key === 'Enter') checkPassword();
    });

    // パスワード欄を変更したら、エラーメッセージを削除
    $("#password_input").on("input", function () {
        $('.password_mismatch').hide();
    });
});