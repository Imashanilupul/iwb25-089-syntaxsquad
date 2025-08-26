import chromadb



def get_chroma_client():
    client = chromadb.HttpClient(
        ssl=True,
        host='api.trychroma.com',
        tenant='04141fab-b6ef-467b-a678-56fb4e058867',
        database='Trasparent System',
        headers={
            'x-chroma-token': 'ck-2qXHG1fxDTUgo8h8ebSiHBr4GDozmEY6dRjuSKzXxofB'
        }
    )
    return client
