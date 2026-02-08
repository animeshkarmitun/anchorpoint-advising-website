#!/usr/bin/env bash
# ============================================================================
#  🚀 SERVER SETUP MASTER — Generic, Idempotent, Resumable
# ============================================================================
#  Usage:  bash server-setup.sh
#  Config: Saved to ~/.server-setup.conf (auto-loaded on re-run)
# ============================================================================

CONFIG_FILE="$HOME/.server-setup.conf"

# ── Colors & Helpers ────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

log_header()  { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}\n"; }
log_ok()      { echo -e "  ${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
log_fail()    { echo -e "  ${RED}❌ $1${NC}"; }
log_info()    { echo -e "  ${DIM}ℹ  $1${NC}"; }
log_prompt()  { echo -en "  ${BOLD}▸ $1${NC}"; }

separator() {
    echo -e "${DIM}  ──────────────────────────────────────────${NC}"
}

# ── Config Management ──────────────────────────────────────────────────────

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        return 0
    fi
    return 1
}

save_config() {
    cat > "$CONFIG_FILE" <<EOF
# Server Setup Config — generated $(date +"%Y-%m-%d %H:%M:%S")
APP_NAME="$APP_NAME"
REPO_URL="$REPO_URL"
PROJECT_DIR="$PROJECT_DIR"
APP_PORT="$APP_PORT"
DOMAIN_NAME="$DOMAIN_NAME"
GIT_BRANCH="$GIT_BRANCH"
HEALTH_ENDPOINT="$HEALTH_ENDPOINT"
SSL_EMAIL="$SSL_EMAIL"
INSTALL_CMD="$INSTALL_CMD"
BUILD_CMD="$BUILD_CMD"
START_CMD="$START_CMD"
EOF
    chmod 600 "$CONFIG_FILE"
    log_ok "Config saved to $CONFIG_FILE"
}

show_config() {
    echo ""
    echo -e "  ${BOLD}Current Configuration:${NC}"
    separator
    echo -e "  App Name     : ${CYAN}$APP_NAME${NC}"
    echo -e "  Repo URL     : ${CYAN}$REPO_URL${NC}"
    echo -e "  Project Dir  : ${CYAN}$PROJECT_DIR${NC}"
    echo -e "  App Port     : ${CYAN}$APP_PORT${NC}"
    echo -e "  Domain Name  : ${CYAN}${DOMAIN_NAME:-_(none — IP only)_}${NC}"
    echo -e "  Git Branch   : ${CYAN}${GIT_BRANCH:-main}${NC}"
    echo -e "  Health EP    : ${CYAN}${HEALTH_ENDPOINT:-/ (default)}${NC}"
    echo -e "  SSL Email    : ${CYAN}${SSL_EMAIL:-_(none — no renewal alerts)_}${NC}"
    echo -e "  Install Cmd  : ${CYAN}$INSTALL_CMD${NC}"
    echo -e "  Build Cmd    : ${CYAN}${BUILD_CMD:-_(none)_}${NC}"
    echo -e "  Start Cmd    : ${CYAN}$START_CMD${NC}"
    separator
}

prompt_config() {
    echo ""
    log_header "CONFIGURATION"

    log_prompt "App name (used for PM2 & Nginx) [my-app]: "
    read -r input
    APP_NAME="${input:-my-app}"

    log_prompt "GitHub repo SSH URL (e.g. git@github.com:user/repo.git): "
    read -r input
    while [[ -z "$input" ]]; do
        log_fail "Repo URL is required."
        log_prompt "GitHub repo SSH URL: "
        read -r input
    done
    REPO_URL="$input"

    local default_dir="$HOME/$APP_NAME"
    log_prompt "Project directory [$default_dir]: "
    read -r input
    PROJECT_DIR="${input:-$default_dir}"

    log_prompt "App port [3000]: "
    read -r input
    APP_PORT="${input:-3000}"

    log_prompt "Domain name (e.g. example.com, leave empty for IP-only): "
    read -r input
    DOMAIN_NAME="${input:-}"

    log_prompt "Git branch to deploy from [main]: "
    read -r input
    GIT_BRANCH="${input:-main}"

    log_prompt "Health check endpoint (e.g. /api/health) [/]: "
    read -r input
    HEALTH_ENDPOINT="${input:-/}"

    log_prompt "Email for SSL certificate renewal alerts (optional, press Enter to skip): "
    read -r input
    SSL_EMAIL="${input:-}"

    log_prompt "Install command [npm install]: "
    read -r input
    INSTALL_CMD="${input:-npm install}"

    log_prompt "Build command (leave empty to skip) [npm run build]: "
    read -r input
    BUILD_CMD="${input:-npm run build}"

    log_prompt "PM2 start command [npm start]: "
    read -r input
    START_CMD="${input:-npm start}"

    save_config
    show_config
}

ensure_config() {
    if load_config; then
        echo ""
        log_info "Found existing config at $CONFIG_FILE"
        show_config
        log_prompt "Use this config? [Y/n/r(reconfigure)]: "
        read -r choice
        case "$choice" in
            n|N)
                log_info "Quitting. Run again to reconfigure."
                exit 0
                ;;
            r|R)
                prompt_config
                ;;
            *)
                log_ok "Using saved config."
                ;;
        esac
    else
        prompt_config
    fi
}

# ── Step 1: System Update ────────────────────────────────────────────────

step_update() {
    log_header "STEP 1 — System Update & Essentials"

    log_info "Updating package lists..."
    if sudo apt update; then
        log_ok "Package lists updated."
    else
        log_fail "Failed to update package lists."
        return 1
    fi

    log_info "Upgrading installed packages..."
    if sudo apt upgrade -y; then
        log_ok "System packages upgraded."
    else
        log_warn "Some packages may not have upgraded. Continuing..."
    fi

    # Install essential tools
    log_info "Installing essential tools (curl, wget, unzip, htop)..."
    if sudo apt install -y curl wget unzip htop; then
        log_ok "Essential tools installed."
    else
        log_warn "Some tools may not have installed. Continuing..."
    fi
}

# ── Step 2: Swap Memory ─────────────────────────────────────────────────

step_swap() {
    log_header "STEP 2 — Swap Memory (for small servers)"

    # Check if swap already exists
    local swap_total
    swap_total=$(free -m | awk '/^Swap:/ {print $2}')

    if [[ "$swap_total" -gt 0 ]]; then
        log_ok "Swap is already configured: ${swap_total}MB"
        free -h | grep -i swap
        return 0
    fi

    log_info "No swap detected. Creating 2GB swap file..."

    if sudo fallocate -l 2G /swapfile; then
        log_ok "Swap file created."
    else
        log_fail "Failed to create swap file."
        return 1
    fi

    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    log_ok "Swap enabled."

    # Make persistent across reboots
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
        log_ok "Swap added to /etc/fstab (persistent)."
    else
        log_ok "Swap already in /etc/fstab."
    fi

    # Optimize swappiness
    sudo sysctl vm.swappiness=10
    if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf > /dev/null
    fi
    log_ok "Swappiness set to 10."

    separator
    free -h
}

# ── Step 3: Install Node.js ───────────────────────────────────────────────

step_node() {
    log_header "STEP 3 — Install Node.js 22.x"

    if command -v node &>/dev/null; then
        local current_ver
        current_ver=$(node -v | grep -oP '\d+' | head -1)
        if [[ "$current_ver" == "22" ]]; then
            log_ok "Node.js 22.x is already installed ($(node -v))"
            return 0
        else
            log_warn "Node.js is installed but version $(node -v) — upgrading to 22.x"
        fi
    else
        log_info "Node.js not found. Installing..."
    fi

    log_info "Adding NodeSource 22.x repository..."
    if curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -; then
        log_ok "NodeSource repo added."
    else
        log_fail "Failed to add NodeSource repo."
        return 1
    fi

    if sudo apt-get install -y nodejs; then
        log_ok "Node.js installed: $(node -v)"
        log_info "npm version: $(npm -v)"
    else
        log_fail "Failed to install Node.js."
        return 1
    fi
}

# ── Step 4: Install Git ───────────────────────────────────────────────────

step_git() {
    log_header "STEP 4 — Install Git"

    if command -v git &>/dev/null; then
        log_ok "Git is already installed: $(git --version)"
        return 0
    fi

    log_info "Installing Git..."
    if sudo apt install -y git; then
        log_ok "Git installed: $(git --version)"
    else
        log_fail "Failed to install Git."
        return 1
    fi
}

# ── Step 5: SSH + GitHub Deploy Key ───────────────────────────────────────

step_ssh() {
    log_header "STEP 5 — SSH + GitHub Deploy Key"

    # Ensure openssh-client
    if ! command -v ssh-keygen &>/dev/null; then
        log_info "Installing openssh-client..."
        sudo apt install -y openssh-client
    fi
    log_ok "openssh-client available: $(ssh -V 2>&1)"

    # Create .ssh dir
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh

    # Generate key if missing
    local key_path="$HOME/.ssh/github_deploy_key"
    if [[ -f "$key_path" ]]; then
        log_ok "Deploy key already exists at $key_path"
    else
        log_info "Generating new ED25519 deploy key..."
        ssh-keygen -t ed25519 -f "$key_path" -C "github-deploy-key" -N ""
        chmod 600 "$key_path"
        chmod 644 "${key_path}.pub"
        log_ok "Deploy key generated."
    fi

    # Write SSH config (idempotent — overwrites)
    cat > ~/.ssh/config <<'SSHEOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy_key
  IdentitiesOnly yes
SSHEOF
    chmod 600 ~/.ssh/config
    log_ok "SSH config written."

    # Show the public key
    echo ""
    echo -e "  ${BOLD}${YELLOW}┌─────────────────────────────────────────┐${NC}"
    echo -e "  ${BOLD}${YELLOW}│   COPY THIS KEY TO YOUR GITHUB REPO     │${NC}"
    echo -e "  ${BOLD}${YELLOW}│   Settings > Deploy Keys > Add Key      │${NC}"
    echo -e "  ${BOLD}${YELLOW}└─────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  ${CYAN}$(cat "${key_path}.pub")${NC}"
    echo ""

    # Retry loop for SSH test
    while true; do
        log_info "Testing SSH connection to GitHub..."
        local ssh_output
        ssh_output=$(ssh -T git@github.com 2>&1) || true

        if echo "$ssh_output" | grep -qi "successfully authenticated"; then
            log_ok "SSH connection verified! $ssh_output"
            return 0
        else
            log_fail "SSH test failed."
            log_info "Response: $ssh_output"
            echo ""
            echo -e "  ${BOLD}What would you like to do?${NC}"
            echo -e "    ${CYAN}1)${NC} Retry  (after adding key to GitHub)"
            echo -e "    ${CYAN}2)${NC} Show public key again"
            echo -e "    ${CYAN}3)${NC} Skip this step"
            echo -e "    ${CYAN}4)${NC} Quit script"
            echo ""
            log_prompt "Choice [1]: "
            read -r ssh_choice
            case "${ssh_choice:-1}" in
                1) continue ;;
                2)
                    echo ""
                    echo -e "  ${CYAN}$(cat "${key_path}.pub")${NC}"
                    echo ""
                    continue
                    ;;
                3)
                    log_warn "SSH verification skipped. Clone step may fail."
                    return 0
                    ;;
                4)
                    log_info "Exiting."
                    exit 0
                    ;;
                *)
                    log_warn "Invalid choice. Retrying..."
                    continue
                    ;;
            esac
        fi
    done
}

# ── Step 6: Clone Repo & Setup .env ──────────────────────────────────────

step_clone() {
    log_header "STEP 6 — Clone Repo & Setup .env"

    if [[ -z "$REPO_URL" ]]; then
        log_fail "No repo URL configured. Run config first."
        return 1
    fi

    if [[ -d "$PROJECT_DIR/.git" ]]; then
        log_ok "Repo already cloned at $PROJECT_DIR"
        log_info "Pulling latest changes..."
        if git -C "$PROJECT_DIR" pull; then
            log_ok "Pull complete."
        else
            log_warn "Pull failed (maybe uncommitted changes?). Continuing..."
        fi
    else
        log_info "Cloning $REPO_URL into $PROJECT_DIR..."
        if git clone "$REPO_URL" "$PROJECT_DIR"; then
            log_ok "Clone complete."
        else
            log_fail "Clone failed. Is the deploy key added to GitHub? (run step 5)"
            return 1
        fi
    fi

    # Install dependencies
    log_info "Running: $INSTALL_CMD"
    if (cd "$PROJECT_DIR" && $INSTALL_CMD); then
        log_ok "Dependencies installed."
    else
        log_fail "Install command failed: $INSTALL_CMD"
        return 1
    fi

    # .env setup
    local env_file="$PROJECT_DIR/.env"
    if [[ -f "$env_file" ]]; then
        log_ok ".env file already exists."
        log_prompt "Open it in nano to review? [y/N]: "
        read -r edit_choice
        if [[ "$edit_choice" =~ ^[yY]$ ]]; then
            nano "$env_file"
        fi
    else
        log_warn "No .env file found. Opening nano to create one..."
        log_info "Save and exit nano when done (Ctrl+O, Enter, Ctrl+X)"
        echo ""
        sleep 1
        nano "$env_file"
        if [[ -f "$env_file" ]]; then
            log_ok ".env file created."
        else
            log_warn ".env file was not saved. You'll need to create it manually."
        fi
    fi
}

# ── Step 7: Build App ───────────────────────────────────────────────────

step_build() {
    log_header "STEP 7 — Build App"

    if [[ -z "$BUILD_CMD" || "$BUILD_CMD" == "none" ]]; then
        log_info "No build command configured. Skipping build."
        return 0
    fi

    if [[ ! -d "$PROJECT_DIR" ]]; then
        log_fail "Project directory $PROJECT_DIR does not exist. Run step 6 first."
        return 1
    fi

    log_info "Running build command: $BUILD_CMD"
    if (cd "$PROJECT_DIR" && $BUILD_CMD); then
        log_ok "Build complete."
    else
        log_fail "Build failed."
        return 1
    fi
}

# ── Step 8: PM2 Process Manager ──────────────────────────────────────────

step_pm2() {
    log_header "STEP 8 — PM2 Process Manager"

    # Install PM2 globally if missing
    if command -v pm2 &>/dev/null; then
        log_ok "PM2 is already installed: $(pm2 -v)"
    else
        log_info "Installing PM2 globally..."
        if sudo npm install -g pm2; then
            log_ok "PM2 installed: $(pm2 -v)"
        else
            log_fail "Failed to install PM2."
            return 1
        fi
    fi

    if [[ ! -d "$PROJECT_DIR" ]]; then
        log_fail "Project directory $PROJECT_DIR does not exist. Run step 6 first."
        return 1
    fi

    # Stop existing process if running
    if pm2 describe "$APP_NAME" &>/dev/null; then
        log_info "Stopping existing PM2 process '$APP_NAME'..."
        pm2 delete "$APP_NAME"
        log_ok "Old process removed."
    fi

    # Start fresh — detect npm scripts vs direct scripts
    log_info "Starting app with PM2..."

    read -ra CMD_PARTS <<< "$START_CMD"
    local first_part="${CMD_PARTS[0]}"
    local rest_parts="${CMD_PARTS[*]:1}"

    if [[ "$first_part" == "npm" ]]; then
        log_info "Detected npm command. Using npm execution mode."
        log_info "Command: pm2 start npm --name \"$APP_NAME\" -- $rest_parts"

        if (cd "$PROJECT_DIR" && pm2 start npm --name "$APP_NAME" -- $rest_parts); then
            log_ok "App started under PM2 as '$APP_NAME'"
        else
            log_fail "PM2 start failed."
            return 1
        fi
    else
        log_info "Command: pm2 start $START_CMD --name \"$APP_NAME\""
        if (cd "$PROJECT_DIR" && pm2 start $START_CMD --name "$APP_NAME"); then
            log_ok "App started under PM2 as '$APP_NAME'"
        else
            log_fail "PM2 start failed."
            return 1
        fi
    fi

    # Setup PM2 to survive reboot
    local current_user
    current_user=$(whoami)
    log_info "Setting up PM2 startup for user '$current_user'..."

    pm2 startup systemd -u "$current_user" --hp "$HOME" 2>&1 | while read -r line; do
        if echo "$line" | grep -q "^sudo "; then
            log_info "Running: $line"
            eval "$line"
        fi
    done

    pm2 save
    log_ok "PM2 startup configured and state saved."

    separator
    pm2 status
}

# ── Step 9: UFW Firewall ─────────────────────────────────────────────────

step_firewall() {
    log_header "STEP 9 — UFW Firewall"

    # Install UFW if missing
    if ! command -v ufw &>/dev/null; then
        log_info "Installing UFW..."
        if sudo apt install -y ufw; then
            log_ok "UFW installed."
        else
            log_fail "Failed to install UFW."
            return 1
        fi
    else
        log_ok "UFW is already installed."
    fi

    # Allow essential ports
    log_info "Configuring firewall rules..."

    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    log_ok "Defaults set: deny incoming, allow outgoing."

    sudo ufw allow OpenSSH
    log_ok "SSH (22) allowed."

    sudo ufw allow 'Nginx Full'
    log_ok "HTTP (80) + HTTPS (443) allowed."

    # Enable UFW (non-interactive)
    if sudo ufw status | grep -qi "active"; then
        log_ok "UFW is already active."
        sudo ufw reload
        log_ok "Firewall rules reloaded."
    else
        log_info "Enabling UFW..."
        echo "y" | sudo ufw enable
        log_ok "UFW enabled."
    fi

    separator
    sudo ufw status verbose
}

# ── Step 10: Nginx Reverse Proxy ─────────────────────────────────────────

step_nginx() {
    log_header "STEP 10 — Nginx Reverse Proxy"

    # Install Nginx
    if command -v nginx &>/dev/null; then
        log_ok "Nginx is already installed: $(nginx -v 2>&1)"
    else
        log_info "Installing Nginx..."
        if sudo apt install -y nginx; then
            log_ok "Nginx installed."
        else
            log_fail "Failed to install Nginx."
            return 1
        fi
    fi

    # Determine server_name directive
    local server_name_value="_"
    if [[ -n "$DOMAIN_NAME" ]]; then
        server_name_value="$DOMAIN_NAME www.$DOMAIN_NAME"
        log_info "Domain configured: $DOMAIN_NAME"
    else
        log_info "No domain configured — using catch-all."
    fi

    # Write site config
    local nginx_conf="/etc/nginx/sites-available/$APP_NAME"
    log_info "Writing Nginx config to $nginx_conf..."

    sudo tee "$nginx_conf" > /dev/null <<EOF
server {
    listen 80;
    server_name ${server_name_value};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Max upload size
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF
    log_ok "Nginx config written."

    # Enable site
    sudo ln -sf "$nginx_conf" "/etc/nginx/sites-enabled/$APP_NAME"
    log_ok "Site enabled."

    # Disable default site
    if [[ -f /etc/nginx/sites-enabled/default ]]; then
        sudo rm -f /etc/nginx/sites-enabled/default
        log_ok "Default site disabled."
    fi

    # Test and reload
    log_info "Testing Nginx configuration..."
    if sudo nginx -t; then
        log_ok "Nginx config test passed."
        sudo systemctl enable nginx
        sudo systemctl restart nginx
        log_ok "Nginx restarted and enabled on boot."
    else
        log_fail "Nginx config test FAILED. Check the config file."
        return 1
    fi

    separator
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo -e "  ${GREEN}${BOLD}Your app should now be accessible at:${NC}"
        echo -e "  ${DIM}  → http://$DOMAIN_NAME${NC}"
        echo ""
        echo -e "  ${YELLOW}Make sure your domain's DNS A record points to this server's IP.${NC}"
    else
        echo -e "  ${GREEN}${BOLD}Your app should now be accessible on port 80${NC}"
        echo -e "  ${DIM}  → http://<your-server-ip>${NC}"
    fi
}

# ── Step 11: SSL / HTTPS (Let's Encrypt) ─────────────────────────────────

step_ssl() {
    log_header "STEP 11 — SSL / HTTPS (Let's Encrypt)"

    # Check if domain is configured
    if [[ -z "$DOMAIN_NAME" ]]; then
        log_fail "No domain name configured."
        log_info "SSL requires a domain name. Run 'C' to reconfigure and add one."
        log_info "Then re-run step 10 (Nginx) and step 11 (SSL)."
        return 1
    fi

    # Check DNS resolution
    log_info "Checking if $DOMAIN_NAME resolves to this server..."
    local server_ip
    server_ip=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
    local domain_ip
    domain_ip=$(dig +short "$DOMAIN_NAME" 2>/dev/null | grep -E '^[0-9]+\.' | head -1)

    log_info "Server IP: ${server_ip:-unknown}"
    log_info "Domain IP: ${domain_ip:-not resolving}"

    if [[ -z "$domain_ip" ]]; then
        log_fail "DNS is NOT configured for $DOMAIN_NAME"
        echo ""
        echo -e "  ${BOLD}${YELLOW}┌───────────────────────────────────────────────────────┐${NC}"
        echo -e "  ${BOLD}${YELLOW}│   DNS NOT SET UP — SSL cannot proceed                 │${NC}"
        echo -e "  ${BOLD}${YELLOW}├───────────────────────────────────────────────────────┤${NC}"
        echo -e "  ${BOLD}${YELLOW}│                                                       │${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   Go to your domain registrar and add:               ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}                                                       ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   ${CYAN}A record:  @    → ${server_ip:-<server-ip>}${NC}         ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   ${CYAN}A record:  www  → ${server_ip:-<server-ip>}${NC}         ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}                                                       ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   Then wait for DNS propagation (5-30 min)            ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   and re-run: ${CYAN}bash server-setup.sh${NC} → step 11         ${BOLD}${YELLOW}│${NC}"
        echo -e "  ${BOLD}${YELLOW}│                                                       │${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   Verify with: ${CYAN}dig +short $DOMAIN_NAME${NC}"
        echo -e "  ${BOLD}${YELLOW}│${NC}   Should return: ${CYAN}${server_ip:-<server-ip>}${NC}"
        echo -e "  ${BOLD}${YELLOW}│                                                       │${NC}"
        echo -e "  ${BOLD}${YELLOW}└───────────────────────────────────────────────────────┘${NC}"
        echo ""
        return 1
    elif [[ -n "$server_ip" && "$server_ip" != "$domain_ip" ]]; then
        log_warn "DNS mismatch: $DOMAIN_NAME → $domain_ip but server IP is $server_ip"
        log_warn "SSL will likely fail. DNS may still be propagating."
        log_prompt "Continue anyway? [y/N]: "
        read -r dns_choice
        if [[ ! "$dns_choice" =~ ^[yY]$ ]]; then
            log_info "Aborting SSL setup. Wait for DNS propagation and try again."
            return 1
        fi
    else
        log_ok "DNS verified: $DOMAIN_NAME → $domain_ip"
    fi

    # Install Certbot
    if command -v certbot &>/dev/null; then
        log_ok "Certbot is already installed: $(certbot --version 2>&1)"
    else
        log_info "Installing Certbot and Nginx plugin..."
        if sudo apt install -y certbot python3-certbot-nginx; then
            log_ok "Certbot installed."
        else
            log_fail "Failed to install Certbot."
            return 1
        fi
    fi

    # Request certificate
    log_info "Requesting SSL certificate for $DOMAIN_NAME..."
    echo ""

    # Build email flag
    local email_flag="--register-unsafely-without-email"
    if [[ -n "$SSL_EMAIL" ]]; then
        email_flag="--email $SSL_EMAIL"
        log_info "Using email: $SSL_EMAIL"
    else
        log_info "No email configured — skipping renewal notifications."
    fi

    if sudo certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos --redirect $email_flag; then
        log_ok "SSL certificate installed!"
    else
        # Try without www if www fails
        log_warn "Failed with www. Trying without www subdomain..."
        if sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --redirect $email_flag; then
            log_ok "SSL certificate installed (without www)!"
        else
            log_fail "Certbot failed. Common fixes:"
            log_info "  1. Ensure DNS A record points to this server"
            log_info "  2. Ensure port 80 is open (run step 9)"
            log_info "  3. Ensure Nginx is running (run step 10)"
            log_info "  4. Run manually: sudo certbot --nginx -d $DOMAIN_NAME"
            return 1
        fi
    fi

    # Verify auto-renewal
    log_info "Testing certificate auto-renewal..."
    if sudo certbot renew --dry-run; then
        log_ok "Auto-renewal is working. Certificates will renew automatically."
    else
        log_warn "Auto-renewal dry-run failed. You may need to renew manually."
    fi

    # Setup renewal cron if not exists
    if ! crontab -l 2>/dev/null | grep -q 'certbot renew'; then
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        log_ok "Auto-renewal cron job added (runs daily at 3 AM)."
    else
        log_ok "Auto-renewal cron job already exists."
    fi

    separator
    echo -e "  ${GREEN}${BOLD}🔒 Your site is now secured with HTTPS!${NC}"
    echo -e "  ${DIM}  → https://$DOMAIN_NAME${NC}"
}

# ── Step 12: Health Check ────────────────────────────────────────────────

step_healthcheck() {
    log_header "STEP 12 — Health Check & Verification"

    local total_checks=0
    local passed_checks=0
    local failed_checks=0

    local health_path="${HEALTH_ENDPOINT:-/}"

    # ── Check 1: PM2 process status
    echo ""
    echo -e "  ${BOLD}[1/5] PM2 Process${NC}"
    if command -v pm2 &>/dev/null; then
        local pm2_status
        pm2_status=$(pm2 jlist 2>/dev/null | grep -o "\"name\":\"$APP_NAME\"[^}]*\"status\":\"[^\"]*\"" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [[ "$pm2_status" == "online" ]]; then
            log_ok "PM2 process '$APP_NAME' is ONLINE"
            # Show memory & CPU
            local pm2_info
            pm2_info=$(pm2 jlist 2>/dev/null)
            local mem
            mem=$(echo "$pm2_info" | grep -o "\"name\":\"$APP_NAME\"[^}]*" | grep -o '"memory":[0-9]*' | cut -d: -f2)
            if [[ -n "$mem" && "$mem" -gt 0 ]]; then
                local mem_mb=$((mem / 1024 / 1024))
                log_info "Memory usage: ${mem_mb}MB"
            fi
            ((passed_checks++))
        elif [[ -n "$pm2_status" ]]; then
            log_fail "PM2 process '$APP_NAME' is $pm2_status (not online)"
            log_info "Try: pm2 restart $APP_NAME"
            ((failed_checks++))
        else
            log_fail "PM2 process '$APP_NAME' not found"
            log_info "Try running step 8 to start the app"
            ((failed_checks++))
        fi
    else
        log_fail "PM2 is not installed"
        ((failed_checks++))
    fi
    ((total_checks++))

    # ── Check 2: Nginx status
    echo ""
    echo -e "  ${BOLD}[2/5] Nginx Service${NC}"
    if command -v nginx &>/dev/null; then
        if systemctl is-active --quiet nginx; then
            log_ok "Nginx is running"
            ((passed_checks++))
        else
            log_fail "Nginx is installed but NOT running"
            log_info "Try: sudo systemctl start nginx"
            ((failed_checks++))
        fi
    else
        log_warn "Nginx is not installed (skipping)"
    fi
    ((total_checks++))

    # ── Check 3: Local app response (direct port)
    echo ""
    echo -e "  ${BOLD}[3/5] App on localhost:${APP_PORT}${health_path}${NC}"
    local start_time end_time elapsed http_code
    start_time=$(date +%s%N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "http://127.0.0.1:${APP_PORT}${health_path}" 2>/dev/null) || true
    end_time=$(date +%s%N)
    elapsed=$(( (end_time - start_time) / 1000000 ))

    if [[ "$http_code" =~ ^(200|301|302|304)$ ]]; then
        log_ok "HTTP $http_code — ${elapsed}ms response time"
        ((passed_checks++))
    elif [[ -n "$http_code" && "$http_code" != "000" ]]; then
        log_warn "HTTP $http_code — ${elapsed}ms (unexpected status)"
        ((failed_checks++))
    else
        log_fail "No response from localhost:${APP_PORT}"
        log_info "Is the app running? Check: pm2 logs $APP_NAME"
        ((failed_checks++))
    fi
    ((total_checks++))

    # ── Check 4: HTTP via Nginx (port 80)
    echo ""
    echo -e "  ${BOLD}[4/5] HTTP via Nginx (port 80)${NC}"
    local test_url
    if [[ -n "$DOMAIN_NAME" ]]; then
        test_url="http://$DOMAIN_NAME${health_path}"
    else
        local server_ip
        server_ip=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "127.0.0.1")
        test_url="http://${server_ip}${health_path}"
    fi

    start_time=$(date +%s%N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 -L "$test_url" 2>/dev/null) || true
    end_time=$(date +%s%N)
    elapsed=$(( (end_time - start_time) / 1000000 ))

    if [[ "$http_code" =~ ^(200|301|302|304)$ ]]; then
        log_ok "$test_url → HTTP $http_code — ${elapsed}ms"
        ((passed_checks++))
    elif [[ -n "$http_code" && "$http_code" != "000" ]]; then
        log_warn "$test_url → HTTP $http_code — ${elapsed}ms"
        ((failed_checks++))
    else
        log_fail "No response from $test_url"
        log_info "Check Nginx config and firewall (steps 9-10)"
        ((failed_checks++))
    fi
    ((total_checks++))

    # ── Check 5: HTTPS (if domain + SSL configured)
    echo ""
    echo -e "  ${BOLD}[5/5] HTTPS${NC}"
    if [[ -n "$DOMAIN_NAME" ]]; then
        local https_url="https://$DOMAIN_NAME${health_path}"
        start_time=$(date +%s%N)
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$https_url" 2>/dev/null) || true
        end_time=$(date +%s%N)
        elapsed=$(( (end_time - start_time) / 1000000 ))

        if [[ "$http_code" =~ ^(200|301|302|304)$ ]]; then
            log_ok "$https_url → HTTP $http_code — ${elapsed}ms 🔒"
            ((passed_checks++))
        elif [[ -n "$http_code" && "$http_code" != "000" ]]; then
            log_warn "$https_url → HTTP $http_code — ${elapsed}ms"
            ((failed_checks++))
        else
            log_warn "HTTPS not responding. Run step 11 to setup SSL."
            ((failed_checks++))
        fi
    else
        log_info "No domain configured — skipping HTTPS check."
    fi
    ((total_checks++))

    # ── Summary
    echo ""
    separator
    if [[ $failed_checks -eq 0 ]]; then
        echo -e "  ${GREEN}${BOLD}✅ All checks passed! ($passed_checks/$total_checks)${NC}"
    else
        echo -e "  ${YELLOW}${BOLD}⚠️  $passed_checks passed, $failed_checks failed out of $total_checks checks${NC}"
    fi
    separator

    # ── Show useful info
    echo ""
    echo -e "  ${BOLD}Useful commands:${NC}"
    echo -e "  ${DIM}  pm2 logs $APP_NAME        — View app logs${NC}"
    echo -e "  ${DIM}  pm2 monit                 — Live monitoring${NC}"
    echo -e "  ${DIM}  sudo nginx -t             — Test Nginx config${NC}"
    echo -e "  ${DIM}  sudo tail -f /var/log/nginx/error.log${NC}"

    return $failed_checks
}

# ── Step 13: Generate Deploy Script ──────────────────────────────────────

step_deploy_script() {
    log_header "STEP 13 — Generate Deploy Script"

    local deploy_script="$PROJECT_DIR/deploy.sh"
    local branch="${GIT_BRANCH:-main}"

    if [[ ! -d "$PROJECT_DIR" ]]; then
        log_fail "Project directory $PROJECT_DIR does not exist. Run step 6 first."
        return 1
    fi

    if [[ -f "$deploy_script" ]]; then
        log_warn "deploy.sh already exists at $deploy_script"
        log_prompt "Overwrite it? [y/N]: "
        read -r overwrite_choice
        if [[ ! "$overwrite_choice" =~ ^[yY]$ ]]; then
            log_info "Skipping. Existing deploy.sh preserved."
            return 0
        fi
    fi

    log_info "Generating deploy.sh..."

    # Determine build line
    local build_line=""
    if [[ -n "$BUILD_CMD" && "$BUILD_CMD" != "none" ]]; then
        build_line="
    # Build
    log \"📦 Building...\"
    $BUILD_CMD
    log \"✅ Build complete.\""
    fi

    # Detect PM2 start command style
    local pm2_restart_cmd="pm2 restart $APP_NAME"

    cat > "$deploy_script" <<DEPLOYSCRIPT
#!/usr/bin/env bash
# ============================================================================
#  🚀 DEPLOY SCRIPT — Auto-generated by Server Setup Master
#  Generated: $(date +"%Y-%m-%d %H:%M:%S")
# ============================================================================
#  Usage:
#    bash deploy.sh              — Full deploy (pull + install + build + restart)
#    bash deploy.sh --quick      — Quick deploy (pull + restart, skip install/build)
#    bash deploy.sh --rollback   — Rollback to previous commit
#    bash deploy.sh --status     — Show current deployment info
# ============================================================================

set -e

# ── Config ──────────────────────────────────────────────────────────────
APP_NAME="$APP_NAME"
PROJECT_DIR="$PROJECT_DIR"
GIT_BRANCH="$branch"
INSTALL_CMD="$INSTALL_CMD"
BUILD_CMD="$BUILD_CMD"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/}"
APP_PORT="$APP_PORT"
LOG_FILE="$PROJECT_DIR/deploy.log"

# ── Colors ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log()  { echo -e "  \${DIM}[\$(date +"%H:%M:%S")]\${NC} \$1" | tee -a "\$LOG_FILE"; }
log_ok()   { echo -e "  \${GREEN}✅ \$1\${NC}" | tee -a "\$LOG_FILE"; }
log_fail() { echo -e "  \${RED}❌ \$1\${NC}" | tee -a "\$LOG_FILE"; }
log_warn() { echo -e "  \${YELLOW}⚠️  \$1\${NC}" | tee -a "\$LOG_FILE"; }

# ── Deployment Functions ────────────────────────────────────────────────

do_full_deploy() {
    echo -e "\n\${CYAN}\${BOLD}━━━ 🚀 FULL DEPLOY ━━━\${NC}\n"
    echo "" >> "\$LOG_FILE"
    echo "=== FULL DEPLOY \$(date) ===" >> "\$LOG_FILE"

    cd "\$PROJECT_DIR"

    # Save current commit for rollback
    local prev_commit
    prev_commit=\$(git rev-parse HEAD)
    echo "\$prev_commit" > "\$PROJECT_DIR/.last-deploy-commit"

    # Pull latest
    log "📥 Pulling from \$GIT_BRANCH..."
    git fetch origin "\$GIT_BRANCH"
    git reset --hard "origin/\$GIT_BRANCH"
    local new_commit
    new_commit=\$(git rev-parse --short HEAD)
    local commit_msg
    commit_msg=\$(git log -1 --pretty=format:"%s")
    log_ok "Pulled: \$new_commit — \$commit_msg"

    # Install dependencies
    log "📦 Installing dependencies..."
    \$INSTALL_CMD
    log_ok "Dependencies installed."
$build_line

    # Restart PM2
    log "🔄 Restarting PM2 process..."
    $pm2_restart_cmd
    log_ok "PM2 restarted."

    # Quick health check
    sleep 3
    local http_code
    http_code=\$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://127.0.0.1:\$APP_PORT\$HEALTH_ENDPOINT" 2>/dev/null) || true
    if [[ "\$http_code" =~ ^(200|301|302|304)\$ ]]; then
        log_ok "Health check passed (HTTP \$http_code)"
    else
        log_warn "Health check returned HTTP \$http_code — check logs: pm2 logs \$APP_NAME"
    fi

    echo ""
    echo -e "  \${GREEN}\${BOLD}🎉 Deploy complete!\${NC}"
    echo -e "  \${DIM}  Commit: \$new_commit\${NC}"
    echo -e "  \${DIM}  Time:   \$(date)\${NC}"
    echo ""
}

do_quick_deploy() {
    echo -e "\n\${CYAN}\${BOLD}━━━ ⚡ QUICK DEPLOY ━━━\${NC}\n"
    echo "" >> "\$LOG_FILE"
    echo "=== QUICK DEPLOY \$(date) ===" >> "\$LOG_FILE"

    cd "\$PROJECT_DIR"

    local prev_commit
    prev_commit=\$(git rev-parse HEAD)
    echo "\$prev_commit" > "\$PROJECT_DIR/.last-deploy-commit"

    log "📥 Pulling from \$GIT_BRANCH..."
    git fetch origin "\$GIT_BRANCH"
    git reset --hard "origin/\$GIT_BRANCH"
    local new_commit
    new_commit=\$(git rev-parse --short HEAD)
    log_ok "Pulled: \$new_commit"

    log "🔄 Restarting PM2 process..."
    $pm2_restart_cmd
    log_ok "PM2 restarted."

    sleep 2
    local http_code
    http_code=\$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://127.0.0.1:\$APP_PORT\$HEALTH_ENDPOINT" 2>/dev/null) || true
    if [[ "\$http_code" =~ ^(200|301|302|304)\$ ]]; then
        log_ok "Health check passed (HTTP \$http_code)"
    else
        log_warn "Health check returned HTTP \$http_code"
    fi

    echo ""
    echo -e "  \${GREEN}\${BOLD}⚡ Quick deploy complete!\${NC}"
    echo ""
}

do_rollback() {
    echo -e "\n\${YELLOW}\${BOLD}━━━ ⏪ ROLLBACK ━━━\${NC}\n"
    echo "" >> "\$LOG_FILE"
    echo "=== ROLLBACK \$(date) ===" >> "\$LOG_FILE"

    cd "\$PROJECT_DIR"

    local rollback_file="\$PROJECT_DIR/.last-deploy-commit"
    if [[ ! -f "\$rollback_file" ]]; then
        log_fail "No previous deployment found. Cannot rollback."
        return 1
    fi

    local prev_commit
    prev_commit=\$(cat "\$rollback_file")
    local current_commit
    current_commit=\$(git rev-parse --short HEAD)

    log "Current commit: \$current_commit"
    log "Rolling back to: \$(echo \$prev_commit | cut -c1-7)"

    git checkout "\$prev_commit"
    log_ok "Checked out previous commit."

    log "📦 Installing dependencies..."
    \$INSTALL_CMD
    log_ok "Dependencies installed."
$build_line

    log "🔄 Restarting PM2..."
    $pm2_restart_cmd
    log_ok "PM2 restarted."

    sleep 3
    local http_code
    http_code=\$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://127.0.0.1:\$APP_PORT\$HEALTH_ENDPOINT" 2>/dev/null) || true
    if [[ "\$http_code" =~ ^(200|301|302|304)\$ ]]; then
        log_ok "Health check passed after rollback (HTTP \$http_code)"
    else
        log_warn "Health check returned HTTP \$http_code after rollback"
    fi

    rm -f "\$rollback_file"

    echo ""
    echo -e "  \${YELLOW}\${BOLD}⏪ Rollback complete!\${NC}"
    echo -e "  \${DIM}  Now at: \$(git rev-parse --short HEAD)\${NC}"
    echo ""
}

do_status() {
    echo -e "\n\${CYAN}\${BOLD}━━━ 📋 DEPLOYMENT STATUS ━━━\${NC}\n"

    cd "\$PROJECT_DIR"

    echo -e "  \${BOLD}App Name  :\${NC} \$APP_NAME"
    echo -e "  \${BOLD}Branch    :\${NC} \$GIT_BRANCH"
    echo -e "  \${BOLD}Commit    :\${NC} \$(git rev-parse --short HEAD)"
    echo -e "  \${BOLD}Message   :\${NC} \$(git log -1 --pretty=format:\"%s\")"
    echo -e "  \${BOLD}Date      :\${NC} \$(git log -1 --pretty=format:\"%ci\")"
    echo -e "  \${BOLD}PM2 Status:\${NC} \$(pm2 jlist 2>/dev/null | grep -o '"name":"'\$APP_NAME'"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo 'unknown')"
    echo ""

    if [[ -f "\$LOG_FILE" ]]; then
        echo -e "  \${BOLD}Last 5 deploy log entries:\${NC}"
        grep "^===" "\$LOG_FILE" | tail -5 | while read -r line; do
            echo -e "  \${DIM}  \$line\${NC}"
        done
    fi
    echo ""
}

# ── Main ────────────────────────────────────────────────────────────────

case "\${1:-}" in
    --quick|-q)
        do_quick_deploy
        ;;
    --rollback|-r)
        do_rollback
        ;;
    --status|-s)
        do_status
        ;;
    --help|-h)
        echo ""
        echo -e "  \${BOLD}Usage:\${NC}"
        echo -e "    bash deploy.sh              Full deploy (pull + install + build + restart)"
        echo -e "    bash deploy.sh --quick      Quick deploy (pull + restart only)"
        echo -e "    bash deploy.sh --rollback   Rollback to previous commit"
        echo -e "    bash deploy.sh --status     Show current deployment info"
        echo ""
        ;;
    *)
        do_full_deploy
        ;;
esac
DEPLOYSCRIPT

    chmod +x "$deploy_script"
    log_ok "Deploy script generated at: $deploy_script"

    # Add deploy.sh to .gitignore if not already there
    local gitignore="$PROJECT_DIR/.gitignore"
    if [[ -f "$gitignore" ]]; then
        if ! grep -q 'deploy.sh' "$gitignore"; then
            echo 'deploy.sh' >> "$gitignore"
            log_ok "Added deploy.sh to .gitignore"
        fi
    fi

    # Add deploy.log to .gitignore
    if [[ -f "$gitignore" ]]; then
        if ! grep -q 'deploy.log' "$gitignore"; then
            echo 'deploy.log' >> "$gitignore"
            log_ok "Added deploy.log to .gitignore"
        fi
    fi

    separator
    echo -e "  ${BOLD}Generated deploy.sh with the following commands:${NC}"
    echo ""
    echo -e "  ${CYAN}bash deploy.sh${NC}              — Full deploy (pull + install + build + restart)"
    echo -e "  ${CYAN}bash deploy.sh --quick${NC}      — Quick deploy (pull + restart only)"
    echo -e "  ${CYAN}bash deploy.sh --rollback${NC}   — Rollback to previous commit"
    echo -e "  ${CYAN}bash deploy.sh --status${NC}     — Show current deployment info"
    echo ""
    echo -e "  ${DIM}Deploy log: $PROJECT_DIR/deploy.log${NC}"
}

# ── Menu ─────────────────────────────────────────────────────────────────

STEPS=(
    "System Update & Essentials"
    "Swap Memory (2GB)"
    "Install Node.js 22.x"
    "Install Git"
    "Setup SSH + GitHub Deploy Key"
    "Clone Repo & Setup .env"
    "Build App"
    "Install PM2 & Start App"
    "UFW Firewall"
    "Install & Configure Nginx"
    "SSL / HTTPS (Let's Encrypt)"
    "Health Check & Verify"
    "Generate Deploy Script"
)

STEP_FUNCS=(
    step_update
    step_swap
    step_node
    step_git
    step_ssh
    step_clone
    step_build
    step_pm2
    step_firewall
    step_nginx
    step_ssl
    step_healthcheck
    step_deploy_script
)

run_step() {
    local step_num=$1
    local idx=$((step_num - 1))

    if [[ $idx -lt 0 || $idx -ge ${#STEP_FUNCS[@]} ]]; then
        log_fail "Invalid step number: $step_num"
        return 1
    fi

    ${STEP_FUNCS[$idx]}
    local exit_code=$?

    if [[ $exit_code -eq 0 ]]; then
        echo ""
        log_ok "Step $step_num complete: ${STEPS[$idx]}"
    else
        echo ""
        log_fail "Step $step_num failed: ${STEPS[$idx]}"
    fi

    return $exit_code
}

parse_and_run() {
    local input="$1"
    local steps_to_run=()

    # Handle 'A' or 'a' — run all
    if [[ "$input" =~ ^[aA]$ ]]; then
        for i in $(seq 1 ${#STEPS[@]}); do
            steps_to_run+=("$i")
        done
    else
        # Split by comma
        IFS=',' read -ra parts <<< "$input"
        for part in "${parts[@]}"; do
            part=$(echo "$part" | tr -d ' ')
            if [[ "$part" =~ ^([0-9]+)-([0-9]+)$ ]]; then
                local start="${BASH_REMATCH[1]}"
                local end="${BASH_REMATCH[2]}"
                for i in $(seq "$start" "$end"); do
                    steps_to_run+=("$i")
                done
            elif [[ "$part" =~ ^[0-9]+$ ]]; then
                steps_to_run+=("$part")
            else
                log_warn "Ignoring invalid input: '$part'"
            fi
        done
    fi

    if [[ ${#steps_to_run[@]} -eq 0 ]]; then
        log_fail "No valid steps selected."
        return 1
    fi

    # Deduplicate and sort
    local unique_steps
    unique_steps=$(echo "${steps_to_run[@]}" | tr ' ' '\n' | sort -nu)

    echo ""
    log_info "Will run steps: $(echo $unique_steps | tr '\n' ' ')"
    separator

    local failed=0
    for step in $unique_steps; do
        run_step "$step" || ((failed++))
    done

    echo ""
    separator
    if [[ $failed -eq 0 ]]; then
        echo -e "  ${GREEN}${BOLD}🎉 All selected steps completed successfully!${NC}"
    else
        echo -e "  ${YELLOW}${BOLD}⚠️  $failed step(s) had issues. Review the output above.${NC}"
    fi
    separator
}

show_menu() {
    echo ""
    echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║          🚀 SERVER SETUP MASTER             ║${NC}"
    echo -e "${CYAN}${BOLD}╠══════════════════════════════════════════════╣${NC}"
    for i in "${!STEPS[@]}"; do
        printf "${CYAN}${BOLD}║${NC}  ${BOLD}%2d)${NC} %-40s ${CYAN}${BOLD}║${NC}\n" "$((i+1))" "${STEPS[$i]}"
    done
    echo -e "${CYAN}${BOLD}║                                              ║${NC}"
    echo -e "${CYAN}${BOLD}║${NC}  ${BOLD} A)${NC} Run ALL steps                          ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║${NC}  ${BOLD} C)${NC} Reconfigure settings                   ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║${NC}  ${BOLD} Q)${NC} Quit                                   ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    log_prompt "Enter choice (e.g. 1, 3-6, 1,4,6, A): "
}

# ── Main ─────────────────────────────────────────────────────────────────

main() {
    echo -e "${CYAN}${BOLD}"
    echo "  ╔══════════════════════════════════════════════╗"
    echo "  ║                                              ║"
    echo "  ║       🚀  SERVER SETUP MASTER  🚀            ║"
    echo "  ║       Generic · Idempotent · Resumable       ║"
    echo "  ║                                              ║"
    echo "  ╚══════════════════════════════════════════════╝"
    echo -e "${NC}"

    ensure_config

    while true; do
        show_menu
        read -r choice

        case "$choice" in
            [qQ])
                echo ""
                log_ok "Goodbye! Run this script again anytime to resume."
                echo ""
                exit 0
                ;;
            [cC])
                prompt_config
                ;;
            *)
                parse_and_run "$choice"
                ;;
        esac

        echo ""
        log_prompt "Press Enter to return to menu..."
        read -r
    done
}

main "$@"
