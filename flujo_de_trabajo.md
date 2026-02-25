# Flujo de trabajo con GitHub (Features)

Este documento describe el flujo de trabajo acordado para colaborar en el proyecto usando **GitHub**, **ramas feature** y **Pull Requests**.

---

## 1. Clonar el repositorio (solo la primera vez)

```bash
git clone https://github.com/usuario/proyecto.git
cd proyecto
```

---

## 2. Asegurarse de estar en `main` y actualizado

Antes de empezar cualquier trabajo:

```bash
git checkout main
git pull origin main
```

Esto garantiza que todos parten desde la **última versión estable** del proyecto.

---

## 3. Crear una rama feature

Cada integrante crea su propia rama para la funcionalidad que le corresponde:

```bash
git checkout -b feature-front-update-camilo
```

Convención de nombres recomendada:

```
feature-front-login
feature-back-auth
feature-front-update-nombre
```

Una feature debe representar **una sola responsabilidad o funcionalidad**.

---

## 4. Trabajar en la feature

El integrante realiza los cambios necesarios en su rama y guarda los avances con commits:

```bash
git add .
git commit -m "Descripción clara de los cambios realizados"
```

Se pueden hacer varios commits dentro de la misma feature.

---

## 5. Subir la feature a GitHub

Cuando la funcionalidad esté lista:

```bash
git push origin feature-front-update-camilo
```

---

## 6. Crear el Pull Request

En GitHub:

1. Aparece la opción **Compare & Pull Request**
2. Base: `main`
3. Compare: `feature-front-update-camilo`
4. Asignarse como autor
5. Describir claramente:
   - Qué se hizo
   - Qué parte del proyecto se modificó

Luego seleccionar **Create Pull Request**.

---

## 7. Revisión y merge

El responsable del repositorio:

- Revisa los cambios
- Verifica que el proyecto funcione correctamente
- Realiza el **Merge Pull Request**

Una vez hecho el merge, la rama feature deja de usarse.

---

## 8. Actualizar el proyecto después del merge

Todos los integrantes deben sincronizar nuevamente su proyecto:

```bash
git checkout main
git pull origin main
```

Con esto, todos quedan trabajando sobre la **misma versión actualizada del proyecto**.
