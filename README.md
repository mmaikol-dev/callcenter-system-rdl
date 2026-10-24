
# Real Deal Logistics System (RDLS)

A logistics and order management system built with **Laravel** to streamline product distribution, call center management, Google Sheets integration, AI-powered inventory management, and M-Pesa payments.

## 🚀 Features

- **Product & Inventory Management**
  - Create products, assign categories & merchants
  - Track quantities across distributors/agents
  - Prevent deductions when stock reaches zero
  - **AI-Powered Inventory Insights**:
    - Forecast demand using sales & stock data
    - Get restocking recommendations
    - Detect anomalies in stock movement
    - Generate quick reports via AI API

- **Order Management**
  - Fetch & sync orders from **Google Sheets**
  - Handle scheduled & rescheduled deliveries
  - Assign call center agents automatically
  - Track updates with progress storage tables

- **Call Center Module**
  - Assign orders to call center agents
  - Handle voice calls via Africa’s Talking API
  - Logs for incoming & outgoing calls

- **Payments Integration**
  - **M-Pesa STK Push** support
  - **M-Pesa Pull API** for transactions
  - Store and filter transactions by order, phone, and date

- **Automation**
  - Cron jobs for fetching orders & updates
  - Scheduled delivery notifications at 8:00 AM
  - SMS & WhatsApp customer communication

## WhatsApp Inventory Notifications

This feature notifies the warehouse team when stock changes and keeps an auditable record of inventory message delivery. Meta WhatsApp Cloud API is the primary provider; OpenWA is the fallback after a definitive Meta rejection.

### Alert events

- **Depleted stock:** Alert when a product reaches zero stock or below.
- **Near-depletion:** Alert when stock crosses into that product's `quantity_alert` threshold.
- **Stock changes:** Notify after a successful manual stock increase or decrease, including the product, previous and new quantity, change amount, reason when supplied, actor and timestamp.
- **Recovery:** Alert when a depleted or near-depleted product is replenished above its threshold.
- **Daily digest (planned):** Summarize current depleted and near-depleted products with counts and links back to inventory.
- **Delivery health:** Show sent, failed, queued and retried notifications, provider/message IDs and timestamps in an admin-facing history.

### How delivery should work

1. A stock operation commits successfully; failed or rolled-back operations must never send a notification.
2. The inventory event is placed on the queue after commit so the stock update remains fast and delivery can be retried independently.
3. A notification policy checks enabled event types, product thresholds, opted-in recipients and duplicate suppression. Low-stock alerts are sent on threshold transitions rather than on every edit while stock stays low.
4. The delivery service sends through Meta first. After a definitive rejection, it sends through OpenWA and records the primary failure. An ambiguous timeout or server error is marked `unknown` and is not automatically sent through the fallback, to avoid duplicates.
5. Each recipient delivery is stored with a stable idempotency key, status, error summary, retry count and provider message ID. Definitive failures retry with bounded backoff; unknown outcomes require an administrator to check provider delivery first.
6. Administrators can configure recipients and event types, send a test message, inspect delivery history and retry eligible failures.

### Safeguards and configuration

- Require verified, opted-in recipient numbers in international format; restrict settings and manual retries to authorized administrators.
- Use Meta-approved templates when the WhatsApp conversation window requires them. Keep template name, language and parameter mapping configurable.
- Keep Meta access tokens, phone-number IDs and OpenWA endpoint/authentication out of source control. Do not log secrets or full sensitive message payloads.
- The OpenWA fallback sends `POST /api/sessions/{sessionId}/messages/send-text`, authenticates with `X-API-Key`, and supplies `{ "chatId": "<country-code-number>@c.us", "text": "..." }`.
- Deduplicate repeated low-stock alerts until the product recovers above its threshold (or an administrator explicitly requests another alert).
- Provide test sends and clear delivery errors before enabling live sends.

### Setup and operations

1. Configure `WHATSAPP_META_ACCESS_TOKEN`, `WHATSAPP_META_PHONE_NUMBER_ID`, `WHATSAPP_META_TEMPLATE_NAME`, `WHATSAPP_META_TEMPLATE_LANGUAGE`, `OPENWA_BASE_URL`, `OPENWA_SESSION` and `OPENWA_API_KEY` in the server environment. Never commit real values.
2. Create and approve a Meta template whose body has one text parameter for the full inventory alert. Meta can reject an unapproved or differently shaped template; definitive rejection falls back to OpenWA.
3. Run database migrations (including the database queue tables) and a Laravel queue worker (`php artisan queue:work`) so sending and bounded retries happen outside stock update requests. This project uses Laravel's database queue by default, so the `jobs` and `failed_jobs` tables must exist before queuing test or inventory notifications.
4. Open **WhatsApp Alerts**, add opted-in recipients in E.164 format, choose event types, and send a test before enabling recipients.
5. A network timeout or provider 5xx is marked with an unknown outcome and does not trigger automatic fallback or retry; check provider delivery before retrying to avoid duplicates.

Daily digests and quiet hours remain follow-up enhancements. Live sending should be enabled only after any credentials shared during development have been rotated, the Meta template is approved, the OpenWA session is active, and recipient consent is verified.

- **Dashboard & Reports**
  - Filters for orders (status, merchant, date, type, call center, etc.)
  - Analytics & charts for monitoring performance
  - AI-generated summaries for inventory & sales trends

## 🛠️ Tech Stack

- **Backend**: Laravel (PHP 8+)
- **Database**: MySQL
- **Frontend**: Inertia.js + React + TailwindCSS + ShadCN UI
- **AI API**: Google Gemini / OpenAI for inventory insights & reporting
- **APIs**: Google Sheets API, Africa’s Talking Voice/SMS, Safaricom M-Pesa API
- **Deployment**: cPanel + Cron Jobs

## ⚙️ Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/mmaikol-dev/rdlsystem.git
   cd rdlsystem
````

2. Install dependencies:

   ```bash
   composer install
   npm install && npm run build
   ```

3. Configure environment:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

   Update `.env` with:

   * Database credentials
   * Google Sheets API credentials
   * M-Pesa API keys
   * Africa’s Talking credentials
   * AI API Key (Google Gemini / OpenAI)

4. Run migrations:

   ```bash
   php artisan migrate
   ```

5. Start development server:

   ```bash
   php artisan serve
   ```

## 🖥️ Cron Jobs

Add this to cPanel cron:

```bash
* * * * * /usr/local/bin/php /home/realdea1/public_html/realdealsystem/artisan schedule:run >> /home/realdea1/public_html/realdealsystem/storage/logs/cron.log 2>&1
```

## 📊 Key Commands

* Update product quantities:

  ```bash
  php artisan products:update-quantities
  ```

* Fetch and store orders:

  ```bash
  php artisan orders:fetch
  ```

* Sync Google Sheets:

  ```bash
  php artisan orders:update-sheet
  ```

* AI Inventory Insights:

  ```bash
  php artisan ai:inventory-report
  ```

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

## 📜 License

This project is licensed under the MIT License.
