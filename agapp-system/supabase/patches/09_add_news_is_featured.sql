-- SQL patch to add is_featured column to news_announcements
ALTER TABLE news_announcements ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
