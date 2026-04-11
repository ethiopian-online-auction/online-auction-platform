--
-- PostgreSQL database dump
--

\restrict 7Hx3829oRE20IaxmxZvc25XlsRS9sG3B7wbIjHl3PtgegEZiYDz0r48NRgS5CZk

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auctions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auctions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    starting_bid numeric(15,2) NOT NULL,
    current_bid numeric(15,2) NOT NULL,
    buy_now_price numeric(15,2),
    reserve_price numeric(15,2),
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    images jsonb,
    shipping_info jsonb,
    item_condition character varying(50),
    is_private boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT auctions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'ended'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.auctions OWNER TO postgres;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    auction_id uuid NOT NULL,
    bidder_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    is_auto_bid boolean DEFAULT false,
    max_auto_bid numeric(15,2),
    bid_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    is_encrypted boolean DEFAULT false,
    CONSTRAINT bids_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'outbid'::character varying, 'won'::character varying, 'lost'::character varying])::text[])))
);


ALTER TABLE public.bids OWNER TO postgres;

--
-- Name: dashboard_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dashboard_id character varying(100) NOT NULL,
    metrics jsonb NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dashboard_metrics OWNER TO postgres;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disputes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    escrow_transaction_id uuid NOT NULL,
    opened_by_user_id uuid NOT NULL,
    reason text NOT NULL,
    evidence jsonb,
    status character varying(20) DEFAULT 'open'::character varying,
    resolution text,
    resolved_by_admin_id uuid,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT disputes_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'investigating'::character varying, 'resolved'::character varying])::text[])))
);


ALTER TABLE public.disputes OWNER TO postgres;

--
-- Name: escrow_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.escrow_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    escrow_id character varying(50) NOT NULL,
    auction_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    blockchain_tx_hash character varying(255),
    smart_contract_address character varying(255),
    status character varying(30) DEFAULT 'pending'::character varying,
    shipping_id character varying(100),
    shipping_verified_at timestamp without time zone,
    verified_by_admin_id uuid,
    release_conditions jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    released_at timestamp without time zone,
    CONSTRAINT escrow_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in-escrow'::character varying, 'pending-verification'::character varying, 'released'::character varying, 'disputed'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.escrow_transactions OWNER TO postgres;

--
-- Name: fraud_detection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fraud_detection (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    detection_id character varying(100) NOT NULL,
    user_id uuid,
    pattern text NOT NULL,
    confidence_score numeric(5,2) NOT NULL,
    time_stamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    flag_alert boolean DEFAULT false
);


ALTER TABLE public.fraud_detection OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    related_auction_id uuid,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id character varying(100) NOT NULL,
    auction_id uuid,
    buyer_id uuid NOT NULL,
    seller_id uuid,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'ETB'::character varying,
    method character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    escrow_contact_address character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_method_check CHECK (((method)::text = ANY ((ARRAY['telebirr'::character varying, 'chapa'::character varying, 'cbe_birr'::character varying, 'blockchain'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: recommendation_system; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendation_system (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recommendation_id character varying(100) NOT NULL,
    user_id uuid NOT NULL,
    suggested_auctions jsonb,
    reason text
);


ALTER TABLE public.recommendation_system OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reporter_id uuid NOT NULL,
    reported_user_id uuid NOT NULL,
    type character varying(30) NOT NULL,
    description text NOT NULL,
    evidence jsonb,
    status character varying(20) DEFAULT 'open'::character varying,
    severity character varying(20) DEFAULT 'medium'::character varying,
    reviewed_by_admin_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reports_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))),
    CONSTRAINT reports_type_check CHECK (((type)::text = ANY ((ARRAY['fraud'::character varying, 'spam'::character varying, 'harassment'::character varying, 'fake_auction'::character varying])::text[])))
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: seller_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_applications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    business_name character varying(255) NOT NULL,
    business_documents jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    reviewed_by_admin_id uuid,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT seller_applications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewing'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.seller_applications OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    is_verified boolean DEFAULT false,
    is_blacklisted boolean DEFAULT false,
    wallet_balance numeric(15,2) DEFAULT 0.00,
    subscription_plan character varying(20) DEFAULT 'free'::character varying,
    subscription_status character varying(20) DEFAULT 'pending'::character varying,
    commission_rate numeric(5,2),
    language_preference character varying(10) DEFAULT 'en'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_language_preference_check CHECK (((language_preference)::text = ANY ((ARRAY['en'::character varying, 'am'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['buyer'::character varying, 'seller'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT users_subscription_plan_check CHECK (((subscription_plan)::text = ANY ((ARRAY['free'::character varying, 'seller'::character varying, 'premium'::character varying])::text[]))),
    CONSTRAINT users_subscription_status_check CHECK (((subscription_status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: virtual_assistant_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.virtual_assistant_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assistant_id character varying(100) NOT NULL,
    language character varying(10) NOT NULL,
    is_active boolean DEFAULT true,
    reason text
);


ALTER TABLE public.virtual_assistant_logs OWNER TO postgres;

--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(30) NOT NULL,
    amount numeric(15,2) NOT NULL,
    balance_before numeric(15,2) NOT NULL,
    balance_after numeric(15,2) NOT NULL,
    reference_id character varying(100),
    payment_method character varying(30),
    status character varying(20) DEFAULT 'pending'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wallet_transactions_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['telebirr'::character varying, 'chapa'::character varying, 'cbe_birr'::character varying, 'blockchain'::character varying, 'wallet'::character varying])::text[]))),
    CONSTRAINT wallet_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT wallet_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying, 'bid_placed'::character varying, 'bid_refund'::character varying, 'escrow_lock'::character varying, 'escrow_release'::character varying, 'commission'::character varying, 'refund'::character varying])::text[])))
);


ALTER TABLE public.wallet_transactions OWNER TO postgres;

--
-- Data for Name: auctions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auctions (id, seller_id, title, description, category, starting_bid, current_bid, buy_now_price, reserve_price, start_time, end_time, status, images, shipping_info, item_condition, is_private, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bids; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bids (id, auction_id, bidder_id, amount, is_auto_bid, max_auto_bid, bid_time, status, is_encrypted) FROM stdin;
\.


--
-- Data for Name: dashboard_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dashboard_metrics (id, dashboard_id, metrics, last_updated) FROM stdin;
\.


--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disputes (id, escrow_transaction_id, opened_by_user_id, reason, evidence, status, resolution, resolved_by_admin_id, resolved_at, created_at) FROM stdin;
\.


--
-- Data for Name: escrow_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.escrow_transactions (id, escrow_id, auction_id, buyer_id, seller_id, amount, blockchain_tx_hash, smart_contract_address, status, shipping_id, shipping_verified_at, verified_by_admin_id, release_conditions, created_at, released_at) FROM stdin;
\.


--
-- Data for Name: fraud_detection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fraud_detection (id, detection_id, user_id, pattern, confidence_score, time_stamp, flag_alert) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, is_read, related_auction_id, "timestamp", created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, payment_id, auction_id, buyer_id, seller_id, amount, currency, method, status, escrow_contact_address, created_at) FROM stdin;
\.


--
-- Data for Name: recommendation_system; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recommendation_system (id, recommendation_id, user_id, suggested_auctions, reason) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, reporter_id, reported_user_id, type, description, evidence, status, severity, reviewed_by_admin_id, created_at) FROM stdin;
\.


--
-- Data for Name: seller_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_applications (id, user_id, business_name, business_documents, status, reviewed_by_admin_id, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, role, is_verified, is_blacklisted, wallet_balance, subscription_plan, subscription_status, commission_rate, language_preference, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: virtual_assistant_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.virtual_assistant_logs (id, assistant_id, language, is_active, reason) FROM stdin;
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallet_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, payment_method, status, description, created_at) FROM stdin;
\.


--
-- Name: auctions auctions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: dashboard_metrics dashboard_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_metrics
    ADD CONSTRAINT dashboard_metrics_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: escrow_transactions escrow_transactions_escrow_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_escrow_id_key UNIQUE (escrow_id);


--
-- Name: escrow_transactions escrow_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_pkey PRIMARY KEY (id);


--
-- Name: fraud_detection fraud_detection_detection_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_detection
    ADD CONSTRAINT fraud_detection_detection_id_key UNIQUE (detection_id);


--
-- Name: fraud_detection fraud_detection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_detection
    ADD CONSTRAINT fraud_detection_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_id_key UNIQUE (payment_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: recommendation_system recommendation_system_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_system
    ADD CONSTRAINT recommendation_system_pkey PRIMARY KEY (id);


--
-- Name: recommendation_system recommendation_system_recommendation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_system
    ADD CONSTRAINT recommendation_system_recommendation_id_key UNIQUE (recommendation_id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: seller_applications seller_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_applications
    ADD CONSTRAINT seller_applications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: virtual_assistant_logs virtual_assistant_logs_assistant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.virtual_assistant_logs
    ADD CONSTRAINT virtual_assistant_logs_assistant_id_key UNIQUE (assistant_id);


--
-- Name: virtual_assistant_logs virtual_assistant_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.virtual_assistant_logs
    ADD CONSTRAINT virtual_assistant_logs_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: idx_auctions_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_category ON public.auctions USING btree (category);


--
-- Name: idx_auctions_end_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_end_time ON public.auctions USING btree (end_time);


--
-- Name: idx_auctions_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_seller ON public.auctions USING btree (seller_id);


--
-- Name: idx_auctions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_status ON public.auctions USING btree (status);


--
-- Name: idx_bids_auction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_auction ON public.bids USING btree (auction_id);


--
-- Name: idx_bids_bidder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_bidder ON public.bids USING btree (bidder_id);


--
-- Name: idx_bids_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_time ON public.bids USING btree (bid_time);


--
-- Name: idx_escrow_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_escrow_buyer ON public.escrow_transactions USING btree (buyer_id);


--
-- Name: idx_escrow_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_escrow_seller ON public.escrow_transactions USING btree (seller_id);


--
-- Name: idx_escrow_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_escrow_status ON public.escrow_transactions USING btree (status);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_wallet_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallet_type ON public.wallet_transactions USING btree (type);


--
-- Name: idx_wallet_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallet_user ON public.wallet_transactions USING btree (user_id);


--
-- Name: auctions update_auctions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: auctions auctions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bids bids_auction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;


--
-- Name: bids bids_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_escrow_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_escrow_transaction_id_fkey FOREIGN KEY (escrow_transaction_id) REFERENCES public.escrow_transactions(id);


--
-- Name: disputes disputes_opened_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_opened_by_user_id_fkey FOREIGN KEY (opened_by_user_id) REFERENCES public.users(id);


--
-- Name: disputes disputes_resolved_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_resolved_by_admin_id_fkey FOREIGN KEY (resolved_by_admin_id) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_auction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(id);


--
-- Name: escrow_transactions escrow_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_verified_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_verified_by_admin_id_fkey FOREIGN KEY (verified_by_admin_id) REFERENCES public.users(id);


--
-- Name: fraud_detection fraud_detection_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_detection
    ADD CONSTRAINT fraud_detection_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_related_auction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_auction_id_fkey FOREIGN KEY (related_auction_id) REFERENCES public.auctions(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_auction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(id);


--
-- Name: payments payments_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: payments payments_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: recommendation_system recommendation_system_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_system
    ADD CONSTRAINT recommendation_system_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reports reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.users(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: reports reports_reviewed_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reviewed_by_admin_id_fkey FOREIGN KEY (reviewed_by_admin_id) REFERENCES public.users(id);


--
-- Name: seller_applications seller_applications_reviewed_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_applications
    ADD CONSTRAINT seller_applications_reviewed_by_admin_id_fkey FOREIGN KEY (reviewed_by_admin_id) REFERENCES public.users(id);


--
-- Name: seller_applications seller_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_applications
    ADD CONSTRAINT seller_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7Hx3829oRE20IaxmxZvc25XlsRS9sG3B7wbIjHl3PtgegEZiYDz0r48NRgS5CZk

