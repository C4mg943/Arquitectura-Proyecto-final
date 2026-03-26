export class User {
  id: number;
  nombre: string;
  email: string;
  rol: 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR';

  constructor(id: number, nombre: string, email: string, rol: 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR') {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.rol = rol;
  }
}
