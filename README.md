# Massivoto Platform

An Automation Programming Language (APL) for building workflow automations using a DSL that chains commands together with variable flow and human checkpoints.

## Quick Example

```oto
@store/load name="customers" output=customers
@ai/generate model="gemini" prompt="Summarize {customers}" output=summary
@human/validation items=summary display=confirm
@email/send to="team@company.com" body=summary
```

```oto

// conditions for creating images: initial f1 image in different situations
@ai/prompt/reverseImage image=~/f1.png output=f1RacingPrompt
@set/array values=['overtake under the rain', 'first turn', 'monaco tunel'] output=situations

// image generation with retry and collection of results
@ai/generateImage context=situation content=f1RacingPrompt  forEach=situations->situation retry=3 collect=images

// human validation of generated images and saving selected ones
@human/validation items=images display=gallery output=selectedImages
@file/save file={["selection/", "f1-",$index,".png"]| path} forEach=selectedImages->image

```

## Benefits

Compared to n8n:

* Easy to share, copy and paste
* Easy to update
* The code goes in Git, and you can diff the changes, making it part of the CI/CD
* oto is a full language, you can use a debugger (wip though)
* Command line tool available :
  * `oto generate "here is my orders prompt" orders.oto.md` 
  * `oto run orders.oto.md`
* Executables are pure Markdown files, with documentation included

Compared to OpenClaw

* You have a step to understand what WILL happen
* You have tooling and logs to understand what DID happen
* Safety is by design, in isolated containers
* you can still use the `oto yolo "here is my orders prompt"` to generate oto language and execute it immediately



## Structure

```
apps/           Frontend applications (React, Vite)
packages/       Shared libraries
  auth-domain/  OAuth utilities, PKCE, token management
  kit/          Common utilities, logging, errors
  runtime/      APL parser, interpreter, command registry
services/       Backend services (Express)
```

## Commands

```bash
yarn install          # Install all dependencies
yarn build            # Build all packages
yarn test             # Run all tests
yarn dev              # Start all dev servers
```

## License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

### Future: Hybrid Licensing (Planned)

When the project matures, we plan to adopt a hybrid licensing model:

| Component | License | Purpose |
|-----------|---------|---------|
| `packages/runtime` | BSL 1.1 | Protects core engine from commoditization |
| Everything else | Apache 2.0 | Community friendly |

This allows:
- Free local development and self-hosting
- Companies to extend and customize Massivoto
- Protection against cloud providers offering "one-click Massivoto deploy" without agreement

See [license.prd.md](license.prd.md) for the full licensing strategy.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project
