#!/usr/bin/env bash
# Grundeinrichtung eines frischen Ubuntu-24.04-Servers für Culinse.
# Als root ausführen, NACHDEM die Anmeldung per SSH-Schlüssel funktioniert.
# Mehrfaches Ausführen schadet nicht.
#
# Bewusst NICHT enthalten:
# - Firewall: Docker umgeht ufw (Hinweis der Coolify-Doku). Die Ports sperrt die
#   Firewall des Anbieters (bei netcup im Server-Kontrollzentrum): eingehend nur
#   22, 80 und 443, für die Ersteinrichtung von Coolify vorübergehend 8000.
# - Coolify selbst: eigener Schritt, siehe Drehbuch im Vault.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Bitte als root ausfuehren."; exit 1; }

# Ohne hinterlegten Schlüssel würde der nächste Schritt aussperren.
if ! grep -qs 'ssh-' /root/.ssh/authorized_keys; then
  echo "Kein SSH-Schluessel in /root/.ssh/authorized_keys. Abbruch, sonst sperrst du dich aus."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get -y install unattended-upgrades fail2ban curl ca-certificates gnupg rclone jq

# Sicherheitsupdates automatisch einspielen
dpkg-reconfigure -f noninteractive unattended-upgrades

# Anmeldung nur noch mit Schlüssel
cat > /etc/ssh/sshd_config.d/10-culinse.conf <<'SSH'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
SSH
sshd -t
systemctl reload ssh

systemctl enable --now fail2ban

# Auslagerungsdatei: fängt Speicherspitzen beim Bauen der Website ab
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/90-culinse.conf

timedatectl set-timezone Europe/Berlin

# psql in Version 17 (Ubuntu 24.04 bringt 16 mit, die Datenbank läuft mit 17)
if ! command -v psql >/dev/null || ! psql --version | grep -q ' 17\.'; then
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
  . /etc/os-release
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update
  apt-get -y install postgresql-client-17
fi

# Node.js 22 für die Supabase-Kommandozeile (npx supabase) und das Bild-Kopierskript
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get -y install nodejs
fi

install -d -m 700 /root/umzug /root/sicherung
echo
echo "Fertig. psql: $(psql --version) · node: $(node --version) · swap: $(swapon --show --noheadings | awk '{print $3}')"
echo "Naechster Schritt: Coolify installieren (Drehbuch, Abschnitt Server)."
