import { NextFunction, Request, Response, Router } from 'express';
import BaseController from './BaseController';
import { IController } from '../../common/interfaces';
import { IVerificationService } from '@ethereum-sourcify/verification';
import { InputData, getChainId, Logger } from '@ethereum-sourcify/core';
import { NotFoundError } from '../../common/errors'
import { IValidationService, PathBuffer } from '@ethereum-sourcify/validation';
import * as bunyan from 'bunyan';
import config from '../../config';
import fileUpload from 'express-fileupload';

export default class VerificationController extends BaseController implements IController {
    router: Router;
    verificationService: IVerificationService;
    validationService: IValidationService;
    logger: bunyan;

    constructor(verificationService: IVerificationService, validationService: IValidationService) {
        super();
        this.router = Router();
        this.verificationService = verificationService;
        this.validationService = validationService;
        this.logger = Logger("VerificationService");
    }

    verify = async (req: Request, res: Response, next: NextFunction) => {
        let chain;
        try {
            chain = getChainId(req.body.chain);
        } catch (error) {
            return next(error);
        }

        const inputData: InputData = {
            addresses: [req.body.address],
            chain: chain
        }
        const result = await this.verificationService.findByAddress(req.body.address, inputData.chain, config.repository.path);
        if (result.length != 0) {
            res.status(200).send({ result });
        } else {
            if (!req.files) return next(new NotFoundError("Address for specified chain not found in repository"));
            // tslint:disable no-useless-cast
            const filesArr: fileUpload.UploadedFile[] = [].concat(req.files!.files); // ensure an array, regardless of how many files received
            const wrappedFiles = filesArr.map(f => new PathBuffer(f.data));
            const validatedFiles = this.validationService.checkFiles(wrappedFiles);
            const errors = validatedFiles
                            .filter(file => !file.isValid())
                            .map(file => file.info);
            if (errors.length) {
                return next(new NotFoundError(errors.join("\n"), false));
            }
            inputData.files = validatedFiles;
            const matches: any = [];
            matches.push(await this.verificationService.inject(inputData, config.localchain.url));
            Promise.all(matches).then((result) => {
                res.status(200).send({ result })
            }).catch()
        }

    }

    checkByAddresses = async (req: any, res: Response) => {
        let resultArray: Array<Object> = [];
        const map: Map<string, Object> = new Map();
        for (const address of req.query.addresses.split(',')) {
            for (const chainId of req.query.chainIds.split(',')) {
                try {
                    const object: any = await this.verificationService.findByAddress(address, chainId, config.repository.path);
                    object.chainId = chainId;
                    if (object.length != 0) {
                        map.set(address, object[0]);
                        break;
                    }
                } catch (error) {
                    // ignore
                }
            };
            if (!map.has(address)) {
                map.set(address, {
                    "address": address,
                    "status": "false"
                })
            }
        };
        resultArray = Array.from(map.values())
        res.send(resultArray)
    }

    registerRoutes = (): Router => {
        this.router
            .post([
            ], this.safeHandler(this.verify));
        this.router.route('/checkByAddresses')
            .get([], this.safeHandler(this.checkByAddresses));
        return this.router;
    }
}