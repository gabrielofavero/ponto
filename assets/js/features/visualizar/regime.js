const REGIMES_JSON = _getJSON('assets/json/visualizar/Regimes.json');
var regimeFound = true;

function _getRegime() {
    let job = _getLocal('job');
    switch (job) {
        case '':
            regimeFound = false;
            return REGIMES_JSON.comum
        case REGIMES_JSON.estagio:
        case REGIMES_JSON.comum:
            return job;
        default:
            return _jobToRegime(job)
    }
}

function _resizeRegime() {
    window.addEventListener('resize', function () {
        var width = window.innerWidth;
        var regimeTitle = document.getElementById('regimeTitle');
        if (regimeTitle) {
            if (width < 484 || (width < 1400 && width >= 1200)) {
                regimeTitle.innerHTML = 'Modelo';
            } else {
                regimeTitle.innerHTML = 'Modelo de Trabalho';
            }
        }
    });
    window.dispatchEvent(new Event('resize'));
}

function _jobToRegime(job) {
    const formattedJob = job.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const estagio = ['estagio', 'estagiario', 'intern'];
    for (const word of estagio) {
        if (formattedJob.toLowerCase().includes(word)) {
            return REGIMES_JSON.estagio;
        }
    }
    return REGIMES_JSON.comum;
}

function _jobToRegimeDisplayText(job){
    const regime = _jobToRegime(job);
    if (regime === REGIMES_JSON.estagio) {
        return "Estagiário";
    } else {
        const job = _getLocal('job');
        if (job === REGIMES_JSON.comum) {
            return 'Modelo de Trabalho Comum (8h)'
        } else return job;
    }
}

function _saveManualRegime() {
    const job = document.getElementById('regimeInputManual').value;
    if (job != _getLocal('job')) {
        $('#regimeModal').modal('hide');
        localStorage.setItem('job', job);
        _startVisualizar('meuRH')
    } else {
        $('#regimeModal').modal('hide');
    }
}