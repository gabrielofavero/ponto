function _pdfMeuRH(rawData = "") {
    try {
        let year;
        if (rawData) {
            let nameFound = false;
            let jobFound = false;
            let result = {};
            let i = 0;
            let lastKey;

            for (i; i < rawData.length; i++) {
                let value = rawData[i];
                if (value.includes("Nome: ") && !nameFound) {
                    _updateNamePDF(value);
                    nameFound = true;
                } else if (value.includes("Função: ") && !jobFound) {
                    _updateJobPDF(value);
                    jobFound = true;
                } else if (_isFullDate(value)) {
                    isAusente = false;
                    if (lastKey) {
                        let lastObservation = _getTreatedObservationPDF(rawData[i - 1]);
                        if (lastObservation) {
                            result["system"][lastKey]["observation"] = lastObservation
                        }
                    }
                    if (!year) {
                        year = value.split("/")[2];
                        localStorage.setItem('year', year);
                    }
                    _processDayPDF(rawData, result, i);
                    lastKey = rawData[i];
                } else if (value == "Banco de Horas") {
                    _processBancoDeHorasPDF(rawData, result, i);
                    break;
                } else if (_getTextMeuRH(value) == "Ausente"){
                    result["system"][lastKey]["observation"] = "Ausente";
                }
            }
            _updateKeypoints(result);
            _updateAusentes(result);
            localStorage.setItem('meuRH', JSON.stringify(result));
            _start();
        }
    } catch (e) {
        _logger(ERROR, e.message || e.toString());
        _setBadgeMessage('meuRH', 'erroGenerico')
    }
}

function _updateNamePDF(value) {
    let name = value.split(": ")[1];
    let split = name.split(" ");
    for (let i = 0; i < split.length; i++) {
        split[i] = split[i].charAt(0).toUpperCase() + split[i].slice(1).toLowerCase();
    }
    localStorage.setItem('name', split[0]);
    localStorage.setItem('fullName', split.join(" "));
}

function _updateJobPDF(value) {
    let job = value.split(" - ")[1];
    let split = job.split(" ");
    for (let i = 0; i < split.length; i++) {
        split[i] = split[i].charAt(0).toUpperCase() + split[i].slice(1).toLowerCase();
    }
    job = split.join(" ");
    localStorage.setItem('job', job);
}

function _processDayPDF(meuRH, result, i) {
    const key = meuRH[i];
    let system = {
        [key]: {
            punches: [],
            observation: ""
        }
    };
    i++;
    for (i; i < meuRH.length; i++) {
        let value = meuRH[i];
        if (_isFullDate(value) || value == "Banco de Horas") {
            break;
        } else {
            if (value && value.split(":").length == 2) {
                let valid = true;
                let punches = system[key]["punches"];

                if (punches.length > 0) {
                    let time1 = punches[punches.length - 1].split(":");
                    let hour1 = parseInt(time1[0]);
                    let minute1 = parseInt(time1[1]);

                    let time2 = value.split(":");
                    let hour2 = parseInt(time2[0]);
                    let minute2 = parseInt(time2[1]);

                    if (hour2 < hour1 || (hour2 == hour1 && minute2 < minute1)) {
                        valid = false;
                    }
                }

                if (valid) {
                    punches.push(value.replace(" *", ""));
                } else {
                    break;
                }
            }
        }
    }
    result["system"] = Object.assign({}, result["system"], system);
}

function _processBancoDeHorasPDF(meuRH, result, i) {
    let keys = [];
    let values = [];
    let keysFound = false;
    let innerResult = {};
    i++;

    for (i; i < meuRH.length; i++) {
        let value = meuRH[i].replace(",", ".");
        if (value) {
            if (isNaN(value) && !keysFound) {
                keys.push(value);
            } else if (!isNaN(value)) {
                keysFound = true;
                values.push(_numberToTime(parseFloat(value)));
            } else {
                break;
            }
        }
    }
    for (let j = 0; j < keys.length; j++) {
        innerResult[keys[j]] = values[j];
    }
    result["keypoints"] = innerResult;
}

function _getDayTime(day, dayObj) {
    let size = Object.keys(dayObj) / 2;
    let timeArray = [];

    if (size % 2 == 0) {
        for (let i = 1; i <= size; i++) {
            let entrada = dayObj["e" + i];
            let saida = dayObj["s" + i];

            if (entrada && saida) {
                timeArray.push(_timeDifference(entrada, saida));
            } else {
                _logger(ERROR, "Ponto inconsistente: " + day);
                return "Inconsistente";
            }
        }
    } else {
        _logger(ERROR, "Marcações Ímpares: " + day);
        return "Ímpar";
    }

    return _sumTime(timeArray);
}

function _getTreatedObservationPDF(rawData){
    const text = _getTextMeuRH(rawData);
    if (text && !["Ausente", "Compensado", "D.S.R."].includes(text)) {
        return text;
    } else return "";
}

function _getTextMeuRH(rawData) {
    const text = rawData.replace(/\*/g, "").trim();
    if (_isTimeString(text)) {
        return "";
    } else return _getFirstCharUpperCase(text);
}

function _updateAusentes(result){
    let system = result.system;
    const keys = Object.keys(system);
    const today = _newDateNoHours();
    for (let key of keys) {
        const observation = system[key].observation;
        if (observation == "Ausente") {
            system[key].punches = [];
            const date = _dateStringToDate(key);
            if (date.getTime() > today.getTime()){
                system[key].observation = "";
            }
        }
    }
}