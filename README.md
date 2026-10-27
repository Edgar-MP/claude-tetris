# Tetris para Claude Code

Un Tetris que se juega en un panel junto al chat, para entretenerte mientras
Claude trabaja. La partida corre en su propio reloj y se pausa sola cuando el
panel pierde el foco (aparece **SIN FOCO**).

## Instalación

Escribe esto en el prompt de una sesión de Claude Code:

```
/plugin install tetris --marketplace Edgar-MP/claude-tetris
```

Acepta añadir el marketplace con `y` y elige el ámbito. Después, `/tetris`
abre el panel. Si las teclas no responden, haz clic en el tablero.

## Controles

| Tecla | Acción |
| --- | --- |
| `←` `→` | Mover |
| `↑` o `x` | Girar (`z`: al revés) |
| `↓` | Bajar |
| `espacio` | Caída directa |
| `p` | Pausa |
| `r` | Reiniciar |
| `esc` | Devolver el teclado al prompt |

## Requisitos

El panel mide unas 44 columnas, así que conviene una terminal ancha. `/tetris`
lo abre a cualquier ancho.

## Licencia

MIT.
