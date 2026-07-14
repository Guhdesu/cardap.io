import { Server as SocketServer } from 'socket.io';

export function setupSocketEvents(io: SocketServer): void {
  io.on('connection', (socket) => {
    console.log(`[socket] cliente conectado: ${socket.id}`);

    // Cliente da mesa entra na room dela
    socket.on('join_mesa', (data: { mesaId: number }) => {
      const room = `mesa:${data.mesaId}`;
      socket.join(room);
      console.log(`[socket] ${socket.id} entrou na room ${room}`);
    });

    // Staff entra na room do painel
    socket.on('join_staff', () => {
      socket.join('staff');
      console.log(`[socket] ${socket.id} entrou como staff`);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] cliente desconectado: ${socket.id}`);
    });
  });
}
