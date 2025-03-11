// プログレスバーのデザイン
const activeColor = "#2d3985";
const inactiveColor = "#dddddd";

let isPlaying = false;
let isRepeat = false;
let isFirstPlay = true;
let volumes = {
    "all": 1,
    "metronome": 1,
    "soprano": 1,
    "alto": 1,
    "tenor": 1,
    "bass": 1,
    "piano_soprano": 0,
    "piano_alto": 0,
    "piano_tenor": 0,
    "piano_bass": 0
};
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
    bass: "./audios/バス.mp3",
    piano_soprano: "./audios/ピアノ_ソプラノ.mp3",
    piano_alto: "./audios/ピアノ_アルト.mp3",
    piano_tenor: "./audios/ピアノ_テノール.mp3",
    piano_bass: "./audios/ピアノ_バス.mp3"
};

// 音声ソース読み込み後のバッファ格納用
let audioBuffers = {};

// 音声ソース読み込み関数
const getAudioBuffer = async (entries) => {
    const promises = []; // 読み込み完了通知用
    const buffers = {}; // オーディオバッファ格納用
    const errorList = []; // エラー一覧

    entries.forEach((entry) => {
        const promise = new Promise((resolve, reject) => { // エラー発生時にrejectする処理を追加
            const [name, url] = entry; // プロパティ名、ファイルのURLに分割

            // 音声ソース毎に非同期で読み込んでいく
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        reject(new Error(`読み込み時にHTTPエラーが発生しました。 status: ${response.status} for ${name}`)); // HTTPエラーをreject
                    }
                    return response.blob();
                }) // ファイル生データ
                .then(data => data.arrayBuffer()) // ArrayBufferとして取得
                .then(arrayBuffer => {
                    // ArrayBufferを音声データに戻してオブジェクト配列に格納する
                    audioContext.decodeAudioData(arrayBuffer, function (audioBuffer) {
                        buffers[name] = audioBuffer;
                        resolve(); // 読み込み完了通知をpromiseに送る
                    }, (error) => {
                        reject(new Error(`再生準備中にエラーが発生しました。 for ${name}: ${error.message}`)); // デコードエラーをreject
                    });
                })
                .catch(error => {
                    reject(error); // fetchまたはデコードエラーをreject
                });
        });
        promises.push(promise); // 現在実行中のPromiseを格納しておく
    });

    try {
        await Promise.all(promises); // 全ての音声ソース読み込みが完了してから
    } catch (error) {
        errorList.push(error);
    }

    if (errorList.length > 0) {
        // エラーが発生した場合、エラー内容をコンソールに表示し、空のオブジェクトを返す
        errorList.forEach(error => alert(error));
        // エラーが発生したため、ローディング画面を非表示にする
        const loading = document.querySelector(".loading");
        loading.classList.add("loaded");
        return {};
    } else {
        return buffers; // オーディオバッファを返す
    }
};

// 再生関数
function playSound() {
    // Safari用処理
    if (audioContext.state === "interrupted") {
        audioContext.resume().then(() => playSound());
        return;
    }
    if (isFirstPlay) {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        let newTime = audioBuffers.metronome.duration * ($("#progress_bar").val() / 100);
        if (newTime >= 200) {
            newTime = 0;
        }
        startTime = audioContext.currentTime - newTime;

        sources = Object.entries(audioBuffers).map(([name, buffer]) => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            let gainNode = audioContext.createGain();          // 個別のGainNodeを作成
            source.buffer = buffer;    // オーディオバッファをノードに設定
            source.connect(gainNode).connect(audioContext.destination);    // 出力先設定
            source.onended = handleEnded; // 再生終了時の処理を設定
            gainNodes[name] = gainNode;   // GainNodeを保存

            // 再生時のエラーをキャッチ
            try {
                source.start(0, newTime); // 再生開始、エラーを発生させる可能性がある
            } catch (error) {
                alert(`再生に失敗しました ${name}:`, error);
                // 再生エラー時の処理
            }
            current_lyrics_position = getCurrentLyricsPosition(newTime);
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = getCurrentLyricsPosition(newTime);
            $(".block").removeClass("active");
            $('.lyrics').animate({ scrollTop: 0 }, scroll_speed, 'swing');
            return source;
        });

        // 音量を設定
        applyVolumes();
        isFirstPlay = false;
    } else {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    }
};

// 一時停止関数
function pauseSound() {
    audioContext.suspend();
};

// 再生位置の取得関数
function getCurrentTime() {
    if (audioContext.state === "running") {
        return audioContext.currentTime - startTime;
    } else {
        return 0;
    }
};

// 再生終了時の処理
function handleEnded() {
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
        applyVolumes();
    } else {
        isPlaying = false;
        isFirstPlay = true;
        $("#play").show();
        $("#pause").hide();
        // 再生終了時に再生ボタンと一時停止ボタンの表示を切り替える
        $("#play_and_pause").attr("title", "再生").attr("aria-label", "再生");
    }
};

// ソロを解除する関数
function releaseSolo() {
    if (isSolo) {
        isSolo = false;
        $("#metronome_solo").attr("disabled", false);
        Object.keys(solo).forEach(key => {
            const targetVolume = $(`#${key}`);
            solo[key] = false;
            if (mute[key]) {
                targetVolume.val(0);
            } else {
                if (key != 'metronome') {
                    if (targetVolume.data("prev") === undefined) {
                        targetVolume.val(1);
                    } else {
                        targetVolume.val(targetVolume.data("prev"));
                    }
                }
            }
            targetVolume.trigger("input");
            $(`#${key}_solo`).removeClass("active");
            $(`#${key}_mute`).attr("disabled", false);
            $(`#${key}`).attr("disabled", false);
            setRangeStyle($(`#${key}`)[0]);
            $(`#${key}_volume_text`).attr("disabled", false);
        });
    }
};

// 現在のcurrent_lyrics_positionを取得する関数
function getCurrentLyricsPosition(time) {
    for (let i = 0; i < lyrics_time.length; i++) {
        const position = lyrics_time[i];
        if (time < position) {
            if (i == 0) {
                return 0;
            } else {
                return i - 1;
            }
        }
    }
};

// 現在のcurrent_lyrics_sectionを取得する関数
function getCurrentLyricsSection(time) {
    for (let i = 0; i < lyrics_section_time.length; i++) {
        const position = lyrics_section_time[i];
        if (time < position) {
            if (i == 0) {
                return 0;
            } else {
                return i - 1;
            }
        }
    }
};

// ボカロとピアノ音源を切り替える関数
function changeInstrument(target) {
    volumes[target] = $(`#${target}`).val() * $(`#${target}_vocal`).val() * $(`#whole_vocal`).val();
    volumes[`piano_${target}`] = $(`#${target}`).val() * $(`#${target}_piano`).val() * $(`#whole_piano`).val();

    if (!isFirstPlay) {
        setGainNodeVolume(gainNodes[target], volumes[target] * volumes["all"]);
        setGainNodeVolume(gainNodes[`piano_${target}`], volumes[`piano_${target}`] * volumes["all"]);
    }
};

// 楽器タイプが変更された時、詳細設定のバーの設定変更
function setInstrumentStatus(target) {
    if ($(`#${target}_vocal`).val() != 1 && $(`#${target}_vocal`).val() != 0) {
        $(`#${target}_vocal`).data("prev", $(`#${target}_vocal`).val());
    }
    if ($(`#${target}_piano`).val() != 1 && $(`#${target}_piano`).val() != 0) {
        $(`#${target}_piano`).data("prev", $(`#${target}_piano`).val());
    }
    if ($(`#${target}_vocal`).val() == 1 && $(`#${target}_piano`).val() == 1) {
        $(`#${target}_vocal`).data("prev", 1);
        $(`#${target}_piano`).data("prev", 1);
    }

    if ($(`#vocal_${target}`).prop('checked')) {
        $(`#${target}_vocal`).val(1);
    } else {
        $(`#${target}_vocal`).val(0);
    }
    if ($(`#piano_${target}`).prop('checked')) {
        $(`#${target}_piano`).val(1);
    } else {
        $(`#${target}_piano`).val(0);
    }

    if ($(`#vocal_${target}`).prop('checked') && $(`#piano_${target}`).prop('checked')) {
        $(`#${target}_vocal`).attr("disabled", false);
        $(`#${target}_piano`).attr("disabled", false);
        $(`#${target}_vocal_volume_text`).attr("disabled", false);
        $(`#${target}_piano_volume_text`).attr("disabled", false);
        if ($(`#${target}_vocal`).data("prev") !== undefined) {
            $(`#${target}_vocal`).val($(`#${target}_vocal`).data("prev"));
        }
        if ($(`#${target}_piano`).data("prev") !== undefined) {
            $(`#${target}_piano`).val($(`#${target}_piano`).data("prev"));
        }
    } else {
        $(`#${target}_vocal`).attr("disabled", true);
        $(`#${target}_piano`).attr("disabled", true);
        $(`#${target}_vocal_volume_text`).attr("disabled", true);
        $(`#${target}_piano_volume_text`).attr("disabled", true);
    }

    $(`#${target}_vocal`).trigger("input");
    $(`#${target}_piano`).trigger("input");

    $(`#${target}`).trigger("input");
}

// 全てボカロまたはピアノモードであれば、全パート共通の設定の欄の種類欄を設定する関数
function changeInstrumentStatusOfAll() {
    let isAllVocal = $("#vocal_soprano").prop('checked') && $(`#vocal_alto`).prop('checked') && $(`#vocal_tenor`).prop('checked') && $(`#vocal_bass`).prop('checked');
    let isNoVocal = !($("#vocal_soprano").prop('checked') || $(`#vocal_alto`).prop('checked') || $(`#vocal_tenor`).prop('checked') || $(`#vocal_bass`).prop('checked'));
    let isAllPiano = $("#piano_soprano").prop('checked') && $(`#piano_alto`).prop('checked') && $(`#piano_tenor`).prop('checked') && $(`#piano_bass`).prop('checked');
    let isNoPiano = !($("#piano_soprano").prop('checked') || $(`#piano_alto`).prop('checked') || $(`#piano_tenor`).prop('checked') || $(`#piano_bass`).prop('checked'));

    if (isAllPiano && isAllVocal) {
        $("#vocal").prop('checked', true);
        $("#piano").prop('checked', true);
    } else if (isAllVocal && isNoPiano) {
        $("#vocal").prop('checked', true);
        $("#piano").prop('checked', false);
    } else if (isAllPiano && isNoVocal) {
        $("#vocal").prop('checked', false);
        $("#piano").prop('checked', true);
    }
    $('input[name="instrument_type"]').trigger("change");
};

// 歌詞やセクションをタップしたときなど、指定した位置に歌詞を移動する関数
function moveSoundTo(newTime) {
    startTime = audioContext.currentTime - newTime;
    $("#current_time").text(convertTimeFormat(newTime));
    if (isFirstPlay) {
        sources = Object.entries(audioBuffers).map(([name, buffer]) => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            let gainNode = audioContext.createGain();          // 個別のGainNodeを作成
            source.buffer = buffer;    // オーディオバッファをノードに設定
            source.connect(gainNode).connect(audioContext.destination);    // 出力先設定
            source.start(0, newTime);    // 再生
            source.onended = handleEnded; // 再生終了時の処理を設定
            gainNodes[name] = gainNode;   // GainNodeを保存
            current_lyrics_position = getCurrentLyricsPosition(newTime);
            $(".lyrics_row").removeClass("active");
            current_lyrics_section = getCurrentLyricsPosition(newTime);
            $(".block").removeClass("active");
            return source;
        });

        // 音量を設定
        applyVolumes();
        isFirstPlay = false;
        isPlaying = true;
        $("#play").toggle();
        $("#pause").toggle();
        $("#play_and_pause").attr("title", "一時停止").attr("aria-label", "一時停止");
    } else {
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
        if (!isPlaying) {
            isPlaying = true;
            $("#play").toggle();
            $("#pause").toggle();
            $("#play_and_pause").attr("title", "一時停止").attr("aria-label", "一時停止");
            playSound();
        }
    }
}

// 音量設定関数
function setGainNodeVolume(gainNode, volume) {
    gainNode.gain.value = volume;
}

// 音量設定適用関数
function applyVolumes() {
    Object.keys(gainNodes).forEach(gainNodeKey => {
        setGainNodeVolume(gainNodes[gainNodeKey], volumes[gainNodeKey] * volumes.all);
    });
}

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
        $(this).attr("title", isPlaying ? "一時停止" : "再生").attr("aria-label", isPlaying ? "一時停止" : "再生");

        // isPlayingがtrueの時、音楽を再生し、再生と一時停止の表示を切り替える
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
        moveSoundTo(newTime);
    });

    // 歌詞がクリックされた時の動作
    $(".lyrics_row").on("click", function () {
        const newTime = lyrics_time[$(this).attr("id")];
        moveSoundTo(newTime);
    });

    // 歌詞セクションがクリックされた時の動作
    $(".block").on("click", function () {
        const newTime = lyrics_section_time[$(this).attr("id").replace("_sec", "")];
        moveSoundTo(newTime);
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
    $("#whole").on("input", function () {
        const volume = $(this).val();
        volumes["all"] = volume;
        if (!isFirstPlay) {
            applyVolumes();
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
        if (!isFirstPlay) {
            setGainNodeVolume(gainNodes.metronome, volume * volumes["all"]);
        }
    });

    // パート別の音量が変更された時の動作

    $(".part_volume").on("input", function () {
        const target = $(this).attr("id");
        const volume = $(this).val();
        if (volume == 0) {
            $(`#${target}_mute`).addClass("active");
            $(this).parents('.setting_panel').addClass("muted");
            if (!isSolo) {
                mute[target] = true;
            }
        } else if (volumes[target] == 0) {
            mute[target] = false;
            $(`#${target}_mute`).removeClass("active");
            if ($(`#vocal_${target}`).prop("checked") || $(`#piano_${target}`).prop("checked")) {
                $(this).parents('.setting_panel').removeClass("muted");
            }
        }
        changeInstrument(target);
    });

    // ボカロとピアノのの音量が変更された時の動作
    $(".instrument_volume").on("input", function () {
        const id = $(this).attr("id").split('_');
        const target = id[1] == 'piano' ? 'piano_' + id[0] : id[0];
        const volume = $(this).val();

        if (id[0] == 'whole') {
            if (!isFirstPlay) {
                Object.keys(gainNodes).forEach(gainNodeKey => {
                    if (id[1] == 'piano') {
                        if (gainNodeKey.split('_')[0] == 'piano') {
                            volumes[gainNodeKey] = $(`#${gainNodeKey.split('_')[1]}`).val() * $(`#${gainNodeKey.split('_')[1]}_piano`).val() * volume;
                            setGainNodeVolume(gainNodes[gainNodeKey], volumes[gainNodeKey] * volumes["all"]);
                        }
                    } else {
                        if (gainNodeKey.split('_')[0] != 'piano' && gainNodeKey != 'metronome') {
                            volumes[gainNodeKey] = $(`#${gainNodeKey}`).val() * $(`#${gainNodeKey}_vocal`).val() * volume;
                            setGainNodeVolume(gainNodes[gainNodeKey], volumes[gainNodeKey] * volumes["all"]);
                        }
                    }
                });
            }
        } else {
            volumes[target] = $(`#${id[0]}`).val() * volume * $(`#whole_${id[1]}`).val();

            if (!isFirstPlay) {
                setGainNodeVolume(gainNodes[target], volumes[target] * volumes["all"]);
            }
        }
    });

    // ミュートボタンが押された時の動作
    $(".mute").on("click", function () {
        const target = $(this).attr("id").replace("_mute", "");
        const targetVolume = $(`#${target}`);
        mute[target] = !mute[target];
        $(this).toggleClass("active");
        if (mute[target]) {
            $(this).parents('.setting_panel').addClass("muted");
        } else {
            $(this).parents('.setting_panel').removeClass("muted");
            if (!$(`#vocal_${target}`).prop("checked") && !$(`#piano_${target}`).prop("checked")) {
                $(this).parents('.setting_panel').addClass("muted");
            }
        }

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
            releaseSolo();
            return;
        }
        isSolo = true;

        if (!solo["metronome"]) {
            // 他のパートがソロの時に、メトロノームのソロモードを変更できないようにする
            $("#metronome_solo").removeClass("active").attr("disabled", true);
        } else {
            if (solo["soprano"] || solo["alto"] || solo["tenor"] || solo["bass"]) {
                // メトロノームがソロの時に、他のパートをソロにしたら自動的にソロを解除する
                $("#metronome_solo").removeClass("active").attr("disabled", true);
                solo["metronome"] = false;
            }
        }
        Object.keys(solo).forEach(key => {
            const targetVolume = $(`#${key}`);
            if (!solo[key] && key !== "metronome") {
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
                setRangeStyle($(`#${key}`)[0]);
                $(`#${key}_volume_text`).attr("disabled", false);
                if (!$(`#vocal_${key}`).prop("checked") && !$(`#piano_${key}`).prop("checked") && key !== "metronome") {
                    $(`#${key}_mute`).parents('.setting_panel').removeClass("muted");
                }
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
            case "11":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(0.5);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "12":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(0.5);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "13":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(0.5);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "14":
                if ($("#with_metronome").prop("checked")) {
                    $("#metronome").val(0.5);
                    $("#metronome").trigger("input");
                }
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(0.5);
                $("#bass").trigger("input");
                break;
            case "15":
                $("#soprano").val(0);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "16":
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(0);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "17":
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(0);
                $("#tenor").trigger("input");
                $("#bass").val(1);
                $("#bass").trigger("input");
                break;
            case "18":
                $("#soprano").val(1);
                $("#soprano").trigger("input");
                $("#alto").val(1);
                $("#alto").trigger("input");
                $("#tenor").val(1);
                $("#tenor").trigger("input");
                $("#bass").val(0);
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

    // ボカロとピアノの交換
    $('.instrument_part_type').on("change", function () {
        const target = $(this).attr("id").replace("vocal_", "").replace("piano_", "");;

        $("#vocal").prop("checked", false);
        $("#piano").prop("checked", false);
        if (!$(`#vocal_${target}`).prop('checked') && !$(`#piano_${target}`).prop('checked') && !mute[target] && !isSolo) {
            $(this).parents('.setting_panel').addClass("muted");
        } else {
            if (!mute[target] && !isSolo) {
                $(this).parents('.setting_panel').removeClass("muted");
            }
        }

        setInstrumentStatus(target);

        changeInstrumentStatusOfAll();
    });

    $('input[name="instrument_type"]').on("change", function () {
        if ($(`#whole_vocal`).val() != 1 && $(`#whole_vocal`).val() != 0) {
            $(`#whole_vocal`).data("prev", $(`#whole_vocal`).val());
        }
        if ($(`#whole_piano`).val() != 1 && $(`#whole_piano`).val() != 0) {
            $(`#whole_piano`).data("prev", $(`#whole_piano`).val());
        }

        if ($(`#whole_vocal`).val() == 1 && $(`#whole_piano`).val() == 1) {
            $(`#whole_vocal`).data("prev", 1);
            $(`#whole_piano`).data("prev", 1);
        }

        if ($(`#vocal`).prop('checked') ^ $(`#piano`).prop('checked')) {
            $(`#whole_vocal`).attr("disabled", true);
            $(`#whole_piano`).attr("disabled", true);
            $(`#whole_vocal_volume_text`).attr("disabled", true);
            $(`#whole_piano_volume_text`).attr("disabled", true);
        } else {
            $(`#whole_vocal`).attr("disabled", false);
            $(`#whole_piano`).attr("disabled", false);
            $(`#whole_vocal_volume_text`).attr("disabled", false);
            $(`#whole_piano_volume_text`).attr("disabled", false);
        }

        if ($(`#whole_vocal`).data("prev") !== undefined) {
            $(`#whole_vocal`).val($(`#whole_vocal`).data("prev"));
        } else {
            $(`#whole_vocal`).val(1);
        }
        if ($(`#whole_piano`).data("prev") !== undefined) {
            $(`#whole_piano`).val($(`#whole_piano`).data("prev"));
        } else {
            $(`#whole_piano`).val(1);
        }

        if ($(`#vocal`).prop('checked') && !$(`#piano`).prop('checked')) {
            $(`#whole_vocal`).val(1);
            $(`#whole_piano`).val(0);
        }
        if ($(`#piano`).prop('checked') && !$(`#vocal`).prop('checked')) {
            $(`#whole_piano`).val(1);
            $(`#whole_vocal`).val(0);
        }
        $(`#whole_vocal`).trigger("input");
        $(`#whole_piano`).trigger("input");

        if ($('#vocal').prop('checked') || $('#piano').prop('checked')) {
            $('input[name="instrument_type_soprano"]').prop('checked', false);
            $('input[name="instrument_type_alto"]').prop('checked', false);
            $('input[name="instrument_type_tenor"]').prop('checked', false);
            $('input[name="instrument_type_bass"]').prop('checked', false);
        }
        if ($('#vocal').prop('checked')) {
            $('#vocal_soprano').prop('checked', true);
            $('#vocal_alto').prop('checked', true);
            $('#vocal_tenor').prop('checked', true);
            $('#vocal_bass').prop('checked', true);
        }
        if ($('#piano').prop('checked')) {
            $('#piano_soprano').prop('checked', true);
            $('#piano_alto').prop('checked', true);
            $('#piano_tenor').prop('checked', true);
            $('#piano_bass').prop('checked', true);
        }
        setInstrumentStatus("soprano");
        setInstrumentStatus("alto");
        setInstrumentStatus("tenor");
        setInstrumentStatus("bass");
    });
});

function setRangeStyle(obj) {
    const ratio = (obj.value - obj.min) / (obj.max - obj.min) * 100;
    $(obj).css("background", `linear-gradient(90deg, ${$(obj).attr("disabled") ? inactiveColor : activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`);
}

function convertTimeFormat(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

$(function () {
    $(".blank").css("height", $("#bottom_menu").height());
    $(".lyrics").css("height", ($(window).height() - $("#bottom_menu").outerHeight() - $("header").outerHeight() - $(".tab_area").outerHeight() - 20));
    // 初期状態で.score_btnの高さを取得できないので、代わりに.range_labelの高さを使う。
    $("#score").css("height", ($(window).height() - $("#bottom_menu").outerHeight() - $("header").outerHeight() - $(".tab_area").outerHeight() - 20 - $(".range_label").outerHeight()));
    window.addEventListener("resize", function () {
        $(".lyrics").css("height", ($(window).height() - $("#bottom_menu").outerHeight() - $("header").outerHeight() - $(".tab_area").outerHeight() - 20));
        $("#score").css("height", ($(window).height() - $("#bottom_menu").outerHeight() - $("header").outerHeight() - $(".tab_area").outerHeight() - 20 - $(".score_btn").outerHeight()));
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
    $("#whole").on("input", function () {
        $("#whole_volume_text").val(Math.floor($(this).val() * 100));
        if ($(this).val() > 3.01) {
            $("#volume_is_too_high").show();
        } else {
            $("#volume_is_too_high").hide();
        }
    });
    $("#metronome").on("input", function () {
        $("#metronome_volume_text").val(Math.floor($(this).val() * 100));
    });
    $(".part_volume, .instrument_volume").on("input", function () {
        const target = $(this).attr("id");
        $(`#${target}_volume_text`).val(Math.floor($(this).val() * 100));
    });
    $(".inputText").on("input", function () {
        const target = $(this).attr("id").replace("_volume_text", "");
        $(`#${target}`).val($(this).val() / 100);
        $(`#${target}`).trigger("input");
    });
});