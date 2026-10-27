import type {SceneController} from '../scene/SceneController';
import type {VisitId} from '../exploration/registry';
import {CompoundPreview} from './CompoundPreview';
import {InteriorPreview} from './InteriorPreview';
export function VisitPreview({island,buildingId,onClose}:{island:SceneController;buildingId:VisitId;onClose:()=>void}){
 return buildingId==='shrine_group'||buildingId==='base_group'||buildingId==='feihua_group'||buildingId==='coast_group'?<CompoundPreview island={island} id={buildingId} onClose={onClose}/>:<InteriorPreview island={island} buildingId={buildingId} onClose={onClose}/>;
}
