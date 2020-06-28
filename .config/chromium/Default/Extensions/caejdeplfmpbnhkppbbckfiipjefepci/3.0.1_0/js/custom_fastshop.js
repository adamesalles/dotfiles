function baCupom_fastshop_esperaFrete(callback) {
    var cep = $('#calculateFreightField').val();
    if (!cep) return callback();
    setTimeout(callback,4000);
}