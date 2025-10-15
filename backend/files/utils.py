import hashlib


def calculate_file_hash(file_obj, chunk_size=8192):
    """
    Calculate SHA-256 hash of a file object.

    Args:
        file_obj: Django UploadedFile object
        chunk_size: Size of chunks to read (default 8KB)

    Returns:
        String: Hexadecimal hash digest
    """
    sha256 = hashlib.sha256()

    # Reset file pointer to beginning
    file_obj.seek(0)

    # Read and hash file in chunks
    while True:
        chunk = file_obj.read(chunk_size)
        if not chunk:
            break
        sha256.update(chunk)

    # Reset file pointer for subsequent operations
    file_obj.seek(0)

    return sha256.hexdigest()


def calculate_chunk_hash(chunk_data):
    """
    Calculate SHA-256 hash of a single chunk.

    Args:
        chunk_data: Bytes object

    Returns:
        String: Hexadecimal hash digest
    """
    sha256 = hashlib.sha256()
    sha256.update(chunk_data)
    return sha256.hexdigest()
