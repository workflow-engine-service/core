#!/usr/bin/env python3
import itertools
import mimetypes
import email.generator
"""
Doug Hellmann's urllib2, translated to python3.
"""


class MultiPartForm():
    """Accumulate the data to be used when posting a form."""

    def __init__(self):
        self.form_fields = []
        self.files = []
        self.boundary = email.generator._make_boundary()
        return

    def get_content_type(self):
        return 'multipart/form-data; boundary=%s' % self.boundary

    def add_field(self, name, value):
        """Add a simple field to the form data."""
        self.form_fields.append((name, value))
        return

    def add_file(self, fieldname, filename, fileHandle, mimetype=None):
        """Add a file to be uploaded."""
        body = fileHandle.read()
        if mimetype is None:
            mimetype = mimetypes.guess_type(
                filename)[0] or 'application/octet-stream'
        self.files.append((fieldname, filename, mimetype, body))
        return

    def make_result(self):
        """Return bytes representing the form data, including attached files."""
        # Build a list of lists, each containing "lines" of the
        # request.  Each part is separated by a boundary string.
        # Once the list is built, return a string where each
        # line is separated by '\r\n'.
        parts = []
        part_boundary = '--' + self.boundary
        # print('value:', self.form_fields)
        # Add the form fields
        parts.extend(
            [bytes(part_boundary, 'utf-8'),
             bytes('Content-Disposition: form-data; name="%s"' % name, 'utf-8'),
             b'',
             bytes(value, 'utf-8'),
             ]
            for name, value in self.form_fields
        )

        # Add the files to upload
        parts.extend(
            [bytes(part_boundary, 'utf-8'),
             bytes('Content-Disposition: file; name="%s"; filename="%s"' %
                   (field_name, filename), 'utf-8'),
             bytes('Content-Type: %s' % content_type, 'utf-8'),
             b'',
             body,
             ]
            for field_name, filename, content_type, body in self.files
        )

        # Flatten the list and add closing boundary marker,
        # then return CR+LF separated data
        flattened = list(itertools.chain(*parts))
        flattened.append(bytes('--' + self.boundary + '--', 'utf-8'))
        flattened.append(b'')
        self.form_data = b'\r\n'.join(flattened)

    # def __str__(self):
    #     return str({'self.form_fields': self.form_fields, 'self.files': '{} pieces'.format(len(self.files)), 'self.boundary': self.boundary})

    # def __repr__(self):
    #     return str({'self.form_fields': self.form_fields, 'self.files': '{} pieces'.format(len(self.files)), 'self.boundary': self.boundary})
