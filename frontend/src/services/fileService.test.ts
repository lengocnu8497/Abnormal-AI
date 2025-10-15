import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
// Require the module after mocking axios so axios is mocked before fileService imports it
const { fileService } = require('./fileService');

describe('fileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploadFile - happy path', async () => {
    const fakeFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const respData = { id: '1', original_filename: 'hello.txt' };
    mockedAxios.post.mockResolvedValueOnce({ data: respData });

    const result = await fileService.uploadFile(fakeFile);

    expect(mockedAxios.post).toHaveBeenCalled();
    expect(result).toEqual(respData);
  });

  test('getFiles - happy path', async () => {
    const files = [{ id: '1' }];
    mockedAxios.get.mockResolvedValueOnce({ data: files });

    const result = await fileService.getFiles();

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/files/'));
    expect(result).toEqual(files);
  });

  test('deleteFile - happy path', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});

    await expect(fileService.deleteFile('1')).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('/files/1/'));
  });

  test('downloadFile - happy path triggers DOM download', async () => {
    const blob = new Blob(['data'], { type: 'text/plain' });
    mockedAxios.get.mockResolvedValueOnce({ data: blob });

    // jsdom may not implement createObjectURL/revokeObjectURL - provide fallback
    if (!window.URL.createObjectURL) {
      // @ts-ignore
      window.URL.createObjectURL = jest.fn().mockReturnValue('blob:fake');
    }
    if (!window.URL.revokeObjectURL) {
      // @ts-ignore
      window.URL.revokeObjectURL = jest.fn();
    }
    const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL');
    const revokeSpy = jest.spyOn(window.URL, 'revokeObjectURL');

    // Spy on link click by creating and overriding createElement
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');

    await expect(fileService.downloadFile('/file/url', 'file.txt')).resolves.toBeUndefined();

    expect(mockedAxios.get).toHaveBeenCalledWith('/file/url', { responseType: 'blob' });
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
    removeSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  test('downloadFile - unhappy path throws error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedAxios.get.mockRejectedValueOnce(new Error('network'));

    await expect(fileService.downloadFile('/bad', 'f')).rejects.toThrow('Failed to download file');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('getWeeklySummary & getYearlySummary - happy paths', async () => {
    const weekly = { period_start: '2025-01-01' };
    const yearly = { period_start: '2025-01-01' };
    mockedAxios.get.mockResolvedValueOnce({ data: weekly }).mockResolvedValueOnce({ data: yearly });

    const w = await fileService.getWeeklySummary();
    const y = await fileService.getYearlySummary();

    expect(w).toEqual(weekly);
    expect(y).toEqual(yearly);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/summaries/weekly/'));
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/summaries/yearly/'));
  });

  test('uploadFileInChunks - happy path single chunk', async () => {
    const data = new Uint8Array(1024); // small file < 1MB
    const file = new File([data], 'chunk.txt', { type: 'text/plain' });
    const returned = { id: 'file1' };

    mockedAxios.post.mockResolvedValueOnce({ data: { complete: true, file: returned } });

    const onProgress = jest.fn();
    const res = await fileService.uploadFileInChunks(file, onProgress);

    expect(res).toEqual(returned);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  test('uploadFileInChunks - unhappy path no completion', async () => {
    const data = new Uint8Array(1024);
    const file = new File([data], 'chunk.txt', { type: 'text/plain' });

    // Simulate server never returning complete:true
    mockedAxios.post.mockResolvedValueOnce({ data: { complete: false } });

    await expect(fileService.uploadFileInChunks(file)).rejects.toThrow('Upload failed: all chunks sent but no completion response');
  });
});
