const net = require('net');
const connectedClients = {};
const server = net.createServer();

function broadcastMessage(clients, senderPort, message) {
    Object.entries(clients).forEach(([port, clientData]) => {
        if (port !== senderPort) {
            clientData.socket.write(message);
        }
    });
}

server.on('connection', (socket) => {
    let clientName = '';
    let isAuthenticated = false;
    const clientPort = String(socket.remotePort);

    // socket.setTimeout(60000);

    socket.on('data', (data) => {
        const message = data.toString().trim();

        if (message.startsWith('<NOME>')) {
            const requestedName = message.substring(6).trim();

            const nameAlreadyExists = Object.values(connectedClients).some(
                (client) => client.name === requestedName
            );

            if (!nameAlreadyExists) {
                clientName = requestedName;
                isAuthenticated = true;
                connectedClients[clientPort] = { name: clientName, socket };
                broadcastMessage(connectedClients, clientPort, `<NOVO> ${clientName}\n`);
                socket.write('<ACK>\n');
            } else {
                socket.write('<NACK>\n');  
            }
        }

        if (!isAuthenticated) {
            socket.write('<ERRO> Você precisa se identificar com <NOME> antes de usar comandos.\n');
            return;
        }

        if (message.startsWith('<ALL>')) {
            const msgContent = message.substring(5).trim();
            const formattedMessage = `<${clientName}> ${msgContent}\n`;
            broadcastMessage(connectedClients, clientPort, formattedMessage);
        }

        if (message.startsWith('<WHO>')) {
            const lista = Object.values(connectedClients)
            .map(c => `${ c.name}`)
            socket.write(`<WHO> {${lista}} \n`);
        }   

        const recipientClient = Object.values(connectedClients).find(
            (client) => message.startsWith(`${client.name} `)
        );

        if (recipientClient) {
            const recipientName = recipientClient.name;
            const privateMessage = message.substring(recipientName.length + 1).trim(); // +1 for the space

            if (privateMessage) {
                 const formattedMessage = `<PRIVADO> ${clientName}: ${privateMessage}\n`;
                 const sent = sendMessageToClientByName(connectedClients, recipientName, formattedMessage);

                 if (!sent) {
                     socket.write(`<ERRO> Usuário '${recipientName}' não encontrado (ao tentar enviar mensagem privada).\n`);
                 } else {
                     socket.write(`<CONFIRMACAO> Mensagem enviada para ${recipientName}.\n`);
                 }
            } else {
                 socket.write(`<ERRO> Mensagem privada para ${recipientName} está vazia.\n`);
            }
        }

        if (message.startsWith('<SAIR>')) {
            broadcastMessage(connectedClients, clientPort, `<SAIU> ${clientName}\n`);
            socket.end();
            socket.destroy();
        }
    });

    socket.on('close', () => {
        console.log(`Cliente ${clientName} desconectado`);
        delete connectedClients[clientPort];
    });

    socket.on('error', (err) => {
        console.error(`Erro no cliente ${clientName}: ${err.message}`);
    });

    socket.on('timeout', () => {
        console.log(`Cliente ${clientName} inativo - conexão encerrada`);
        socket.end();
        socket.destroy();
    });
});

server.listen(42000, () => {
    console.log(`Servidor escutando na porta ${server.address().port}`);
});
