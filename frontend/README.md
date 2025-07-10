# Finanzas Dashboard

... (resto del README)

## 📱 Lineamientos para Responsividad (Responsive Design)

Esta app está diseñada para ser 100% responsive y verse perfecta en cualquier dispositivo (computadora, móvil, tablet, TV, etc). Para mantener y extender esta responsividad, sigue estas buenas prácticas:

### 1. Usa siempre clases Tailwind responsive
- Ejemplo: `w-full max-w-xs sm:max-w-md md:max-w-lg`, `grid-cols-1 sm:grid-cols-2`, `p-2 sm:p-4`, etc.
- Aplica breakpoints (`sm:`, `md:`, `lg:`, `xl:`) en grids, paddings, márgenes, fuentes y anchos.

### 2. Evita anchos/altos fijos
- Prefiere `w-full`, `min-w-0`, `max-w-full`, `h-auto`.
- No uses `width: 400px` o similares salvo casos muy justificados.

### 3. Tablas y listas grandes
- Usa `overflow-x-auto` en el contenedor y `min-w-[600px]` en la tabla para permitir scroll horizontal en móvil.

### 4. Formularios
- Usa `flex-col` en móvil y `md:flex-row` en desktop para inputs y botones.
- Inputs y selects siempre con `w-full`.

### 5. Menús y modales
- Usa `w-full max-w-xs sm:max-w-md md:max-w-lg` para que nunca se salgan de pantalla.
- Asegúrate de que los formularios y botones sean legibles y accesibles en todos los tamaños.

### 6. Testea en todos los dispositivos y con zoom
- Prueba en móvil, tablet, desktop y con diferentes niveles de zoom antes de dar por terminado un cambio visual.

### 7. Si agregas nuevos componentes
- Usa siempre breakpoints y clases responsivas desde el inicio.
- Prueba el componente en diferentes tamaños antes de finalizarlo.

---

¡Sigue estos lineamientos y tu dashboard siempre será moderno, usable y profesional en cualquier dispositivo! 🚀

... (resto del README) 