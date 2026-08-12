import logging
from supabase import create_client, Client
from app.config import get_settings

logger = logging.getLogger("db")

class DBService:
    """Service wrapper for Supabase database operations using Service Role Key (admin privileges)."""

    def __init__(self):
        settings = get_settings()
        self.url = settings.supabase_url
        self.key = settings.supabase_service_role_key
        
        if self.url and self.key:
            try:
                self.client: Client = create_client(self.url, self.key)
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None
        else:
            logger.warning("Supabase credentials missing in configuration.")
            self.client = None

    def save_product(self, product_data: dict) -> dict:
        """Create or update product context configuration."""
        if not self.client:
            logger.warning("No database client. Cannot save product.")
            return {}

        user_id = product_data.get("user_id")
        url = product_data.get("url")

        if not user_id or not url:
            logger.error("Missing user_id or url in product data.")
            return {}

        try:
            # Check if product configuration already exists for this user and URL
            response = self.client.table("products").select("*").eq("user_id", user_id).eq("url", url).execute()
            existing = response.data

            # Columns to save
            db_payload = {
                "user_id": user_id,
                "url": url,
                "name": product_data.get("name", ""),
                "description": product_data.get("description", ""),
                "keywords": product_data.get("keywords", []),
                "competitor_names": product_data.get("competitor_names", []),
                "subreddit_list": product_data.get("subreddit_list", []),
                "icp": product_data.get("icp", {})
            }

            if existing:
                # Update
                product_id = existing[0]["id"]
                logger.info(f"Updating existing product config: {product_id}")
                update_resp = self.client.table("products").update(db_payload).eq("id", product_id).execute()
                return update_resp.data[0] if update_resp.data else {}
            else:
                # Insert new
                logger.info(f"Inserting new product config for {url}")
                insert_resp = self.client.table("products").insert(db_payload).execute()
                return insert_resp.data[0] if insert_resp.data else {}
        except Exception as e:
            logger.error(f"Error saving product context: {e}")
            return {}

    def get_active_products(self) -> list[dict]:
        """Fetch all configured active products for background monitoring."""
        if not self.client:
            return []
        try:
            response = self.client.table("products").select("*").execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting active products: {e}")
            return []

    def get_product_by_id(self, product_id: str) -> dict:
        """Fetch product details by ID."""
        if not self.client:
            return {}
        try:
            response = self.client.table("products").select("*").eq("id", product_id).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error getting product by id: {e}")
            return {}

    def get_existing_lead_urls(self, product_id: str) -> set[str]:
        """Fetch all already collected lead URLs for a product to implement caching/deduplication."""
        if not self.client:
            return set()
        try:
            response = self.client.table("leads").select("source_url").eq("product_id", product_id).execute()
            urls = {row["source_url"] for row in response.data or [] if row.get("source_url")}
            logger.info(f"Found {len(urls)} cached lead URLs in database for product {product_id}")
            return urls
        except Exception as e:
            logger.error(f"Error getting existing lead URLs: {e}")
            return set()

    def save_leads(self, leads: list[dict]) -> list[dict]:
        """Bulk save new leads to leads table."""
        if not self.client or not leads:
            return []
        try:
            logger.info(f"Bulk saving {len(leads)} leads to Supabase...")
            response = self.client.table("leads").insert(leads).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error saving leads: {e}")
            return []
