# Tetris para Claude Code

Un Tetris que se juega en un panel junto al chat, para entretenerte mientras
Claude trabaja. La partida corre en su propio reloj y se pausa sola cuando el
tablero pierde el foco (aparece **SIN FOCO**).

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
| `esc` | Cierra el panel |

## El foco

`/tetris` abre la partida en pausa. Haz clic en el tablero (o pulsa una tecla
con el foco en él) para empezar. Se vuelve a pausar, con **SIN FOCO**, cuando:

- tecleas en el prompt del chat,
- haces clic en el aside fuera del tablero,
- el puntero sale del tablero (por ejemplo, para ir al chat),
- pasan 8 segundos sin pulsar ninguna tecla (así se nota un cambio de ventana).

Claude Code no avisa de los cambios de foco de ventana, por eso las dos últimas
son aproximaciones. Para reanudar, pulsa una tecla o haz clic en el tablero.

## Requisitos

El panel mide unas 44 columnas, así que conviene una terminal ancha. `/tetris`
lo abre a cualquier ancho.

## Actualizar

Si ya lo tenías instalado, desde una terminal:

```
claude plugin marketplace update claude-tetris
claude plugin update tetris@claude-tetris
```

Reinicia Claude Code para aplicar la actualización.

## Licencia

MIT.
