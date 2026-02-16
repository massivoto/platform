



scope : variable of the program, will be lost after it
executionContext.data: Key/Value serializable data organized in collections, like MongoDB
executionContext.env: Key/Value serializable data, but private and secure, for secrets and credentials
executionContext.store: pointer to a storage system, such as S3, for heavy data (images, videos, etc.)

We have two problems here:
- we have only one store available for running the program. This is a problem if we need a vextore database
  specialized for a RAG, and still need a classic database
- We don't have access to regular files. I think it will be very efficient for the platform to have a filesystem
  locally? I must be able to access these files if I use a Local Runner, but also to upload these files if we run on
  the saas. The files are typically images or json, and can be stored in folders organization. If we run in the saas,
  we could sync it locally with a git system, or in a s3 bucket. So it must be versatile.

## Need

The test: each option must work in these two contexts:

1. As a command argument
@ai/describe image=??? output=description

2. Inside a braced expression
@ai/generate prompt="Describe {???}" output=result

Also we need to be able to use multiple stores

## Current behaviour

From store:

@ai/describe image=store.images.john output=description
@ai/generate prompt="Describe {store.people.john.name}" output=result

From data:

@ai/describe image=images.john output=description
@ai/generate prompt="Describe {people.john.name}" output=result

## Proposal: select for multiple store

We can pick only one store per action, but it should not be a problem. However, it will make
it very hard to track the data flow and know which one is selected, especially with gotos.
This will lead to declare the current store in way too much places. So it's a no-go.

@store/select name=vector

## Proposal: use stores and store as namespaces

They are both usable and most of the time, we won't use more than one store, so we can use the `store` namespace for the 
main store, and `stores` for the others. We will have difficult code only in difficult situations. People
concerned will easily know how to deal with it.

@ai/describe image=store.images.john output=description
@ai/describe image=stores.vector.images.john output=description
@ai/generate prompt="Describe {store.people.john.name}" output=result
@ai/generate prompt="Describe {stores.vector.people.john.name}" output=result

Problem: it's very typo risky

## Proposal: use a mapper to select the store

@ai/describe image=db->analytics.images.john output=description
@ai/describe image=db->vector.images.john output=description

## Proposal define in the scope the different stores

vector123 and analytics123 are store pointers, that are clearly configured in 
the Massivoto configuration (out of scope right now)

@store/declare name=vector id=vector123
@store/declare name=analytics id=analytics123

Then use them in the code:

@ai/describe image={vector.images.john} output=description
@ai/describe image={analytics.images.john} output=description


## Proposal: for files

The tilde prefix seems a very good option. Each file will start with `~/` to signal
it's a file.
We can eventually use:

@core/files/cd to=~/myfolder
@core/files/ls    // current path would be ~/myfolder
@core/files/ls log=true 

I think with syntax highlight, it will be very visual.

We need to support globs as a shortcut for multiple files:

@ai/describe image=~/images/**/*.jpg output=descriptions

## Difficulty: files

The output could be a list of file paths, so probably a array.
We need to know inside the runtime that we have a file, so it must be typed in the AST, as a FileNode, or GlobNode.

## difficulty: files in expressions

@core/files/load path={["images", driver.name, "helmet.png"]|path} output=helmet


