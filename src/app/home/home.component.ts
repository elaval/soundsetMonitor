import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'lodash';
import * as moment from 'moment'
import { S3ServiceService } from '../services/s3-service.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  items: any[];
  lastActivity: any;
  lastActivityTime: any;
  selectedFolder: any;

  constructor(
    private db: AngularFirestore,
    private s3Service: S3ServiceService
  ) { }

  ngOnInit() {
    this.db.collection('jobsDone').valueChanges().subscribe((data) => {
      data.forEach((d => {
        const components = d['outputKey'].match(/^data\/(.*)\/output\/([^\/]+)\/(.*)$/)
        const domain = components[1];
        const folder = components[2];
        const key = components[3];
        d["folder"] = folder;
        d["key"] = key;
        
      }))
      const nestedItems = []

      const groupedItems = _.groupBy(data, (d) => d.folder);
      _.each(groupedItems, (items, folder) => {
        nestedItems.push({"folder": folder, "items":_.sortBy(items, d => d.key)})
      })
      
      this.items = nestedItems;
      this.selectedFolder = this.items[0];
    });

    this.db.collection("logs").doc("LAST_ACTIVITY").get().subscribe((d) => {
      this.lastActivity = d.data();
      this.lastActivityTime = this.lastActivity.timestamp.toDate();
    })
  }

  download(item) {
    this.s3Service.getPresignedUrl(item.outputKey).subscribe(data => {
      const url = data && data['url'];
      window.open(url, '_blank');
    });

  }
}
