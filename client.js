const net = require('net');
const readline = require('readline');

// Cria a interface de entrada do terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
});

// Cria o socket do cliente
const client = new net.Socket();

// Conecta ao servidor
client.connect(42000, '192.168.201.17', () => {
    console.log('✅ Conectado ao servidor TCP');
    rl.prompt();
});

// Ouve mensagens recebidas do servidor
client.on('data', (data) => {
    const message = data.toString();
    rl.write(null, {ctrl: true, name: 'u'});
    rl.write(`📨 ${message}\n`);
    rl.prompt(true);

});
// Envia mensagens digitadas para o servidor
rl.on('line', (line) => {
    client.write(line.trim());
    rl.prompt();
});

// Fecha a conexão caso o servidor desconecte
client.on('close', () => {
    console.log('\n❌ Conexão encerrada pelo servidor.');
    process.exit(0);
});

// Trata erros de conexão
client.on('error', (err) => {
    console.error('Erro de conexão:', err.message);
    process.exit(1);
});
