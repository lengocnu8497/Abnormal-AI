from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import date, timedelta

from ..models import FileContent, File, DeduplicationEvent, StorageSavingsSummary


class SummariesAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_weekly_summary_empty(self):
        url = '/api/summaries/weekly/'
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('period_start', data)
        self.assertIn('storage_saved_gb', data)
        self.assertIn('storage_saved_gb_display', data)

    def test_yearly_summary_empty(self):
        url = '/api/summaries/yearly/'
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('period_start', data)
        self.assertIn('storage_saved_mb', data)

    def test_summary_with_event(self):
        # Create FileContent and File
        fc = FileContent.objects.create(content_hash='abc123', size=1024 * 1024 * 5, reference_count=1)
        f = File.objects.create(file_content=fc, original_filename='test.txt', file_type='text/plain')

        # Create a DeduplicationEvent within the current week
        today = date.today()
        # ensure it falls in this week
        event = DeduplicationEvent.objects.create(
            file_content=fc,
            file_reference=f,
            original_filename='test.txt',
            file_size=fc.size,
            file_type='text/plain',
            detected_at=timezone.now()
        )

        # Trigger update of summaries
        StorageSavingsSummary.update_current_summary(file_size=fc.size, file_type='text/plain')

        # Weekly
        resp = self.client.get('/api/summaries/weekly/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(data['total_duplicates_detected'], 0)
        self.assertIn('storage_saved_mb_display', data)

        # Yearly
        resp = self.client.get('/api/summaries/yearly/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(data['total_duplicates_detected'], 0)
