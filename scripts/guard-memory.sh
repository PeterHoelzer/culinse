#!/bin/sh
# Bricht den Dev-Start ab, wenn macOS bereits unter Speicherdruck steht.
# Hintergrund: Am 16.7. und 18.7.2026 ist der Mac per Kernel-Panic
# (Watchdog-Timeout, Speicher-Kompressor am Limit) eingefroren, als zum
# ohnehin vollen Speicher ein Next.js-Dev-Build dazukam. Dieser Guard
# verhindert genau diese Kombination. Läuft nur auf macOS, sonst no-op.

[ "$(uname)" = "Darwin" ] || exit 0

# kern.memorystatus_vm_pressure_level: 1 = normal, 2 = warning, 4 = critical
level=$(sysctl -n kern.memorystatus_vm_pressure_level 2>/dev/null || echo 1)

if [ "$level" -ge 2 ]; then
  if [ -n "$SKIP_MEMORY_GUARD" ]; then
    echo "⚠️  Speicherdruck Level $level — Guard per SKIP_MEMORY_GUARD übersprungen."
    exit 0
  fi
  echo ""
  echo "⛔  Abbruch: macOS meldet bereits Speicherdruck (Level $level, 1 = normal)."
  echo "    Ein Next.js-Dev-Build würde den Rechner jetzt einfrieren können"
  echo "    (so sind die Abstürze am 16.7. und 18.7. entstanden)."
  echo ""
  echo "    → Erst speicherhungrige Apps schließen (Chrome-Tabs, Spotify, WhatsApp …),"
  echo "      dann 'npm run dev' erneut starten."
  echo "    → Notfall-Override: SKIP_MEMORY_GUARD=1 npm run dev"
  echo ""
  exit 1
fi

exit 0
