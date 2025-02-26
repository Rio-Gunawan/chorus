// プログレスバーのデザイン
const activeColor = "#2d3985";
const inactiveColor = "#dddddd";

let isPlaying = false;
let isRepeat = false;
let isFirstPlayed = false;
let volumes = { "all": 1, "metronome": 1, "soprano": 1, "alto": 1, "tenor": 1, "bass": 1 };
let mute = { "metronome": false, "soprano": false, "alto": false, "tenor": false, "bass": false };
let solo = { "metronome": false, "soprano": false, "alto": false, "tenor": false, "bass": false };
let isSolo = false;
let startTime = 0;
let sources = [];
let gainNodes = {};

let lyrics_time = [2.7, 8.7, 14.5, 20.4, 26.2, 32.0, 37.9, 43.8, 49.4, 55.4, 60.9, 63.5, 66.8, 72.6, 75.2, 78.6,
    84.7, 88.0, 90.9, 103.0, 105.9, 108.5, 111.7, 114.7, 117.5, 120.6, 131.6, 134.5, 137.5, 141.4, 143.3, 148.1, 152.8,
    156.1, 159.0, 162.7, 164.6, 168.2, 170.4, 176.6, 181.0, 185.1, 189.8, 199];
let current_lyrics_position = 0;

let lyrics_section_time = [0, 14.5, 26.2, 37.9, 60.9, 84.7, 103.8, 131.6, 152.8, 185.1, 199];
let current_lyrics_section = 0;
let isFirstClickedLyrics = false;

let scroll_adjust = 0;
let scroll_speed = 400;

// Web Audio API用のコンテキスト
let audioContext = null;

// 読み込む音声ソース用のオブジェクト（プロパティ名は再生時に使用）
const audioFiles = {
    metronome: "./audios/メトロノーム.mp3",
    soprano: "./audios/ソプラノ.mp3",
    alto: "./audios/アルト.mp3",
    tenor: "./audios/テノール.mp3",
    bass: "./audios/バス.mp3"
};

// 音声ソース読み込み後のバッファ格納用
let audioBuffers = {};

// 音声ソース読み込み関数
const getAudioBuffer = async (entries) => {
    const promises = [];    // 読み込み完了通知用
    const buffers = {};        // オーディオバッファ格納用

    entries.forEach((entry) => {
        const promise = new Promise((resolve) => {
            const [name, url] = entry;    // プロパティ名、ファイルのURLに分割

            // 音声ソース毎に非同期で読み込んでいく
            fetch(url)
                .then(response => response.blob())    // ファイル生データ
                .then(data => data.arrayBuffer())    // ArrayBufferとして取得
                .then(arrayBuffer => {
                    // ArrayBufferを音声データに戻してオブジェクト配列に格納する
                    audioContext.decodeAudioData(arrayBuffer, function (audioBuffer) {
                        buffers[name] = audioBuffer;
                        resolve();    // 読み込み完了通知をpromiseに送る
                    });
                });
        });
        promises.push(promise);        // 現在実行中のPromiseを格納しておく
    });
    await Promise.all(promises);    // 全ての音声ソース読み込みが完了してから
    return buffers;                    // オーディオバッファを返す
};

// 再生関数
const playSound = function () {
    // Safari用処理
    if (audioContext.state === "interrupted") {
        audioContext.resume().then(() => playSound());
        return;
    }
    if (isFirstPlayed) {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    } else {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        startTime = audioContext.currentTime;
        sources = Object.entries(audioBuffers).map(([name, buffer]) => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            let gainNode = audioContext.createGain();          // 個別のGainNodeを作成
            source.buffer = buffer;    // オーディオバッファをノードに設定
            source.connect(gainNode).connect(audioContext.destination);    // 出力先設定
            source.start();    // 再生
            source.onended = handleEnded; // 再生終了時の処理を設定
            gainNodes[name] = gainNode;   // GainNodeを保存
            current_lyrics_position = 0;
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = 0;
            $(".block").removeClass("active");
            $('.lyrics').animate({ scrollTop: 0 }, scroll_speed, 'swing');
            return source;
        });

        // 音量を設定
        Object.keys(gainNodes).forEach(gainNodeKey => {
            gainNodes[gainNodeKey].gain.value = volumes[gainNodeKey] * volumes["all"];
        });
        isFirstPlayed = true;
    }
};

// 一時停止関数
const pauseSound = function () {
    audioContext.suspend();
};

// 再生位置の取得関数
const getCurrentTime = function () {
    if (audioContext.state === "running") {
        return audioContext.currentTime - startTime;
    } else {
        return 0;
    }
};

// 再生終了時の処理
const handleEnded = function () {
    if (getCurrentTime() < audioBuffers.metronome.duration) {
        return; // 再生が終わっていない場合は何もしない
    }
    if (isRepeat) {
        startTime = audioContext.currentTime;
        sources = Object.entries(audioBuffers).map(([name, buffer]) => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            let gainNode = audioContext.createGain();          // 個別のGainNodeを作成
            source.buffer = buffer;    // オーディオバッファをノードに設定
            source.connect(gainNode).connect(audioContext.destination);    // 出力先設定
            source.start();    // 再生
            current_lyrics_position = 0;
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = 0;
            $(".block").removeClass("active");
            $('.lyrics').animate({ scrollTop: 0 }, scroll_speed, 'swing');
            source.onended = handleEnded; // 再生終了時の処理を設定
            gainNodes[name] = gainNode;   // GainNodeを保存
            return source;
        });
        // 音量を設定
        Object.keys(gainNodes).forEach(gainNodeKey => {
            gainNodes[gainNodeKey].gain.value = volumes[gainNodeKey] * volumes["all"];
        });
    } else {
        isPlaying = false;
        isFirstPlayed = false;
        $("#play").show();
        $("#pause").hide();
    }
};

// ソロを解除する関数
const releaseSolo = function () {
    if (isSolo) {
        Object.keys(solo).forEach(key => {
            const targetVolume = $(`#${key}`);
            solo[key] = false;
            if (mute[key]) {
                targetVolume.val(0);
            } else {
                if (targetVolume.data("prev") === undefined) {
                    targetVolume.val(1);
                } else {
                    targetVolume.val(targetVolume.data("prev"));
                }
            }
            targetVolume.trigger("input");
            $(`#${key}_solo`).removeClass("active");
            $(`#${key}_mute`).attr("disabled", false);
            $(`#${key}`).attr("disabled", false);
            $(`#${key}_volume_text`).attr("disabled", false);
        });
    }
};

// 現在のcurrent_lyrics_positionを取得する関数
const getCurrentLyricsPosition = function (time) {
    for (let i = 0; i < lyrics_time.length; i++) {
        const position = lyrics_time[i];
        if (time < position) {
            return i - 1;
        }
    }
};

// 現在のcurrent_lyrics_sectionを取得する関数
const getCurrentLyricsSection = function (time) {
    for (let i = 0; i < lyrics_section_time.length; i++) {
        const position = lyrics_section_time[i];
        if (time < position) {
            return i - 1;
        }
    }
};

$(async function () {
    // Web Audio API用音声コンテキスト生成
    audioContext = new AudioContext();

    // プロパティ毎にオブジェクトにして配列として取得
    const entries = Object.entries(audioFiles);

    // 音声ソースを読み込んで音声バッファに格納する
    audioBuffers = await getAudioBuffer(entries);

    // 再生ボタンのdisabledを解除
    $("#play_and_pause").prop("disabled", false);

    // ローディング画面を非表示にする
    const loading = document.querySelector(".loading");
    loading.classList.add("loaded");

    const progressbar = $("#progress_bar");
    const currentTime = $("#current_time");
    const durationTime = $("#duration_time");

    // 音楽ファイルが読み込まれた時に、再生時間を表示する
    const duration = audioBuffers.metronome.duration;
    durationTime.text(convertTimeFormat(duration));

    // 再生ボタンがクリックされた時の動作
    $("#play_and_pause").on("click", function () {
        isPlaying = !isPlaying;
        // ボタンの表示を切り替える
        $("#play").toggle();
        $("#pause").toggle();

        // isPlayingがtrueの時、音楽を再生する
        if (isPlaying) {
            playSound();
        } else {
            pauseSound();
        }
    });

    // 再生中の場合に、プログレスバーを動かす
    setInterval(() => {
        if (isPlaying) {
            const current = getCurrentTime();
            const duration = audioBuffers.metronome.duration;
            const progress = (current / duration) * 100;
            progressbar.val(progress);
            setRangeStyle(progressbar[0]);
            currentTime.text(convertTimeFormat(current));

            // 歌詞の更新
            if (current >= lyrics_time[current_lyrics_position]) {
                let target = $(`#${current_lyrics_position}`);
                let position;

                $(`#${current_lyrics_position - 1}`).removeClass("active");
                target.addClass("active");

                if (current >= lyrics_section_time[current_lyrics_section]) {
                    $(`#${current_lyrics_section - 1}_sec`).removeClass("active");
                    $(`#${current_lyrics_section}_sec`).addClass("active");
                    current_lyrics_section++;
                }
                if (current_lyrics_position >= 2 && current_lyrics_position <= 42) {
                    position = Math.round(target.position().top - scroll_adjust + $('.lyrics').scrollTop());
                    $('.lyrics').animate({ scrollTop: position }, scroll_speed, 'swing');
                }
                current_lyrics_position++;
            }
        }
    }, 100);

    // プログレスバーがクリックされた時の動作
    $("#progress_bar").on("input", function () {
        setRangeStyle(this);
        const newTime = audioBuffers.metronome.duration * (this.value / 100);
        startTime = audioContext.currentTime - newTime;
        currentTime.text(convertTimeFormat(newTime));
        sources.forEach((source, index) => {
            source.stop();
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(gainNodes[Object.keys(audioBuffers)[index]]).connect(audioContext.destination);
            newSource.start(0, newTime);
            newSource.onended = handleEnded; // 再生終了時の処理を設定
            sources[index] = newSource;
            current_lyrics_position = getCurrentLyricsPosition(newTime);
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = getCurrentLyricsSection(newTime);
            $(".block").removeClass("active");
        });
    });

    // 歌詞がクリックされた時の動作
    $(".lyrics_row").on("click", function () {
        const newTime = lyrics_time[$(this).attr("id")];
        startTime = audioContext.currentTime - newTime;
        currentTime.text(convertTimeFormat(newTime));
        sources.forEach((source, index) => {
            source.stop();
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(gainNodes[Object.keys(audioBuffers)[index]]).connect(audioContext.destination);
            newSource.start(0, newTime);
            newSource.onended = handleEnded; // 再生終了時の処理を設定
            sources[index] = newSource;
            current_lyrics_position = getCurrentLyricsPosition(newTime);
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = getCurrentLyricsSection(newTime);
            $(".block").removeClass("active");
        });
    });

    // 歌詞セクションがクリックされた時の動作
    $(".block").on("click", function () {
        const newTime = lyrics_section_time[$(this).attr("id").replace("_sec", "")];
        startTime = audioContext.currentTime - newTime;
        currentTime.text(convertTimeFormat(newTime));
        sources.forEach((source, index) => {
            source.stop();
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(gainNodes[Object.keys(audioBuffers)[index]]).connect(audioContext.destination);
            newSource.start(0, newTime);
            newSource.onended = handleEnded; // 再生終了時の処理を設定
            sources[index] = newSource;
            current_lyrics_position = getCurrentLyricsPosition(newTime);
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = getCurrentLyricsSection(newTime);
            $(".block").removeClass("active");
        });
    });

    // 前へボタンがクリックされた時の動作
    $("#prev").on("click", function () {
        sources.forEach((source, index) => {
            source.stop();
            startTime = audioContext.currentTime;
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(gainNodes[Object.keys(audioBuffers)[index]]).connect(audioContext.destination);
            newSource.start();
            current_lyrics_position = 0;
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = 0;
            $(".block").removeClass("active");
            $('.lyrics').animate({ scrollTop: 0 }, scroll_speed, 'swing');
            newSource.onended = handleEnded; // 再生終了時の処理を設定
            sources[index] = newSource;
        });
        progressbar.val(0);
        setRangeStyle(progressbar[0]);
        currentTime.text(convertTimeFormat(0));
    });

    // リピートボタンがクリックされた時の動作
    $("#repeat").on("click", function () {
        isRepeat = !isRepeat;
        $(this).toggleClass("active");
    });

    // 音量が変更された時の処理
    $("#volume").on("input", function () {
        const volume = $(this).val();
        volumes["all"] = volume;
        if (isPlaying) {
            Object.keys(gainNodes).forEach(gainNodeKey => {
                gainNodes[gainNodeKey].gain.value = volumes[gainNodeKey] * volume;
            });
        }
    });

    $("#metronome").on("input", function () {
        const volume = $(this).val();
        if (volume == 0) {
            $("#metronome_mute").addClass("active");
            $(this).parents('.setting_panel').addClass("muted");
            if (!isSolo) {
                mute["metronome"] = true;
            }
        } else if (volumes["metronome"] == 0) {
            mute["metronome"] = false;
            $("#metronome_mute").removeClass("active");
            $(this).parents('.setting_panel').removeClass("muted");
        }
        volumes["metronome"] = volume;
        if (isPlaying) {
            gainNodes.metronome.gain.value = volume * volumes["all"];
        }
    });

    $("#soprano").on("input", function () {
        const volume = $(this).val();
        if (volume == 0) {
            $("#soprano_mute").addClass("active");
            $(this).parents('.setting_panel').addClass("muted");
            if (!isSolo) {
                mute["soprano"] = true;
            }
        } else if (volumes["soprano"] == 0) {
            mute["soprano"] = false;
            $("#soprano_mute").removeClass("active");
            $(this).parents('.setting_panel').removeClass("muted");
        }
        volumes["soprano"] = volume;
        if (isPlaying) {
            gainNodes.soprano.gain.value = volume * volumes["all"];
        }
    });

    $("#alto").on("input", function () {
        const volume = $(this).val();
        if (volume == 0) {
            $("#alto_mute").addClass("active");
            $(this).parents('.setting_panel').addClass("muted");
            if (!isSolo) {
                mute["alto"] = true;
            }
        } else if (volumes["alto"] == 0) {
            mute["alto"] = false;
            $("#alto_mute").removeClass("active");
            $(this).parents('.setting_panel').removeClass("muted");
        }
        volumes["alto"] = volume;
        if (isPlaying) {
            gainNodes.alto.gain.value = volume * volumes["all"];
        }
    });

    $("#tenor").on("input", function () {
        const volume = $(this).val();
        if (volume == 0) {
            $("#tenor_mute").addClass("active");
            $(this).parents('.setting_panel').addClass("muted");
            if (!isSolo) {
                mute["tenor"] = true;
            }
        } else if (volumes["tenor"] == 0) {
            mute["tenor"] = false;
            $("#tenor_mute").removeClass("active");
            $(this).parents('.setting_panel').removeClass("muted");
        }
        volumes["tenor"] = volume;
        if (isPlaying) {
            gainNodes.tenor.gain.value = volume * volumes["all"];
        }
    });

    $("#bass").on("input", function () {
        const volume = $(this).val();
        if (volume == 0) {
            $("#bass_mute").addClass("active");
            $(this).parents('.setting_panel').addClass("muted");
            if (!isSolo) {
                mute["bass"] = true;
            }
        } else if (volumes["bass"] == 0) {
            mute["bass"] = false;
            $("#bass_mute").removeClass("active");
            $(this).parents('.setting_panel').removeClass("muted");
        }
        volumes["bass"] = volume;
        if (isPlaying) {
            gainNodes.bass.gain.value = volume * volumes["all"];
        }
    });

    // ミュートボタンが押された時の動作
    $(".mute").on("click", function () {
        const target = $(this).attr("id").replace("_mute", "");
        const targetVolume = $(`#${target}`);
        $(this).toggleClass("active");
        $(this).parents('.setting_panel').toggleClass("muted");
        mute[target] = !mute[target];
        if (targetVolume.val() === "0") {
            if (targetVolume.data("prev") === undefined) {
                targetVolume.val(1);
            } else {
                targetVolume.val(targetVolume.data("prev"));
            }
        } else {
            targetVolume.data("prev", targetVolume.val());
            targetVolume.val(0);
        }
        targetVolume.trigger("input");
    });

    // ソロボタンが押された時の動作
    $(".solo").on("click", function () {
        const target = $(this).attr("id").replace("_solo", "");
        solo[target] = !solo[target];
        $(this).toggleClass("active");
        if (!(solo["metronome"] || solo["soprano"] || solo["alto"] || solo["tenor"] || solo["bass"])) {
            isSolo = false;
            releaseSolo();
            return;
        }
        isSolo = true;
        Object.keys(solo).forEach(key => {
            const targetVolume = $(`#${key}`);
            if (!solo[key]) {
                if (targetVolume.val() !== "0") {
                    targetVolume.data("prev", targetVolume.val());
                }
                targetVolume.val(0);
                targetVolume.trigger("input");
                $(`#${key}_mute`).addClass("active");
                $(`#${key}_mute`).attr("disabled", true);
                $(`#${key}`).attr("disabled", true);
                $(`#${key}_volume_text`).attr("disabled", true);
                $(`#${key}_mute`).parents('.setting_panel').addClass("muted");
            } else {
                if (targetVolume.val() === "0") {
                    if (targetVolume.data("prev") !== undefined) {
                        targetVolume.val(targetVolume.data("prev"));
                    } else {
                        targetVolume.val(1);
                    }
                } else {
                    targetVolume.data("prev", targetVolume.val());
                }
                targetVolume.trigger("input");
                $(`#${key}_mute`).removeClass("active");
                $(`#${key}_mute`).attr("disabled", true);
                $(`#${key}`).attr("disabled", false);
                $(`#${key}_volume_text`).attr("disabled", false);
                $(`#${key}_mute`).parents('.setting_panel').removeClass("muted");
            }
        });
    });

    // プリセットが選択された時の動作
    $("#preset").on("change", function () {
        const preset = $(this).val();
        if (preset != 0) {
            releaseSolo();
        }
        if (preset != 2) {
            $("#with_metronome").attr("disabled", false);
        }
        switch (preset) {
            case "1":
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "2":
                // メトロノーム入りのチェックボックスを無効化
                $("#with_metronome").attr('checked', true).prop('checked', true).attr("disabled", true);

                $("#metronome").val(1);
                $("#metronome").trigger("input");
                $("#soprano").val(0);
                $("#soprano").trigger("input");
                $("#alto").val(0);
                $("#alto").trigger("input");
                $("#tenor").val(0);
                $("#tenor").trigger("input");
                $("#bass").val(0);
                $("#bass").trigger("input");
                break;
            case "3":
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(0);
                $("#alto").trigger("input");
                $("#tenor").val(0);
                $("#tenor").trigger("input");
                $("#bass").val(0);
                $("#bass").trigger("input");
                break;
            case "4":
                $("#soprano").val(0);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(0);
                $("#tenor").trigger("input");
                $("#bass").val(0);
                $("#bass").trigger("input");
                break;
            case "5":
                $("#soprano").val(0);
                $("#soprano").trigger("input");
                $("#alto").val(0);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(0);
                $("#bass").trigger("input");
                break;
            case "6":
                $("#soprano").val(0);
                $("#soprano").trigger("input");
                $("#alto").val(0);
                $("#alto").trigger("input");
                $("#tenor").val(0);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "7":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(0.2);
                $("#alto").trigger("input");
                $("#tenor").val(0.2);
                $("#tenor").trigger("input");
                $("#bass").val(0.2);
                $("#bass").trigger("input");
                break;
            case "8":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(0.2);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(0.2);
                $("#tenor").trigger("input");
                $("#bass").val(0.2);
                $("#bass").trigger("input");
                break;
            case "9":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(0.2);
                $("#soprano").trigger("input");
                $("#alto").val(0.2);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(0.2);
                $("#bass").trigger("input");
                break;
            case "10":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(0.2);
                $("#soprano").trigger("input");
                $("#alto").val(0.2);
                $("#alto").trigger("input");
                $("#tenor").val(0.2);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            default:
                break;
        }
    });
    // メトロノーム入りのチェックが入った時の動作
    $("#with_metronome").on("change", function () {
        releaseSolo();
        if ($(this).prop("checked")) {
            $("#metronome").val(1);
            $("#metronome").trigger("input");
        } else {
            $("#metronome").val(0);
            $("#metronome").trigger("input");
        }
    });
});

function setRangeStyle(obj) {
    const ratio = (obj.value - obj.min) / (obj.max - obj.min) * 100;
    $(obj).css("background", `linear-gradient(90deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`);
}

function convertTimeFormat(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

$(function () {
    $(".blank").css("height", $("#bottom_menu").height());
    $(".lyrics").css("height", ($(window).height() - $("#bottom_menu").outerHeight() - $("header").outerHeight() - $(".tab_area").outerHeight() - 20));
    window.addEventListener("resize", function () {
        $(".lyrics").css("height", ($(window).height() - $("#bottom_menu").outerHeight() - $("header").outerHeight() - $(".tab_area").outerHeight() - 10));
    });
    Object.values($(".inputRange")).forEach((input) => {
        setRangeStyle(input);
    });
    $(".inputRange").on("input", function () {
        setRangeStyle(this);
    });


    $(".tab2_label").on("click", function () {
        let target = $(`#${current_lyrics_position - 1}`);
        let position = 0;
        if (!isFirstClickedLyrics) {
            isFirstClickedLyrics = true;
            setTimeout(function () {
                scroll_adjust = $("#1").position().top;
                if (current_lyrics_position >= 2) {
                    position = Math.round(target.position().top - scroll_adjust + $('.lyrics').scrollTop());
                    $('.lyrics').animate({ scrollTop: position }, scroll_speed, 'swing');
                }
            }, 1);
        } else {
            if (current_lyrics_position >= 2) {
                setTimeout(function () {
                    position = Math.round(target.position().top - scroll_adjust + $('.lyrics').scrollTop());
                    $('.lyrics').animate({ scrollTop: position }, scroll_speed, 'swing');
                }, 1);
            }
        }
    });

    // 音量のrangeとtextboxの連動
    $("#volume").on("input", function () {
        $("#whole_volume_text").val(Math.floor($(this).val() * 100));
        if ($(this).val() > 3.01) {
            $("#volume_is_too_high").show();
        } else {
            $("#volume_is_too_high").hide();
        }
    });
    $("#whole_volume_text").on("input", function () {
        $("#volume").val($(this).val() / 100);
        $("#volume").trigger("input");
    });
    $("#metronome").on("input", function () {
        $("#metronome_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#metronome_volume_text").on("input", function () {
        $("#metronome").val($(this).val() / 100);
        $("#metronome").trigger("input");
    });
    $("#soprano").on("input", function () {
        $("#soprano_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#soprano_volume_text").on("input", function () {
        $("#soprano").val($(this).val() / 100);
        $("#soprano").trigger("input");
    });
    $("#alto").on("input", function () {
        $("#alto_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#alto_volume_text").on("input", function () {
        $("#alto").val($(this).val() / 100);
        $("#alto").trigger("input");
    });
    $("#tenor").on("input", function () {
        $("#tenor_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#tenor_volume_text").on("input", function () {
        $("#tenor").val($(this).val() / 100);
        $("#tenor").trigger("input");
    });
    $("#bass").on("input", function () {
        $("#bass_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#bass_volume_text").on("input", function () {
        $("#bass").val($(this).val() / 100);
        $("#bass").trigger("input");
    });
});