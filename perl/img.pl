#!/usr/bin/perl
use MP3::Tag;

my $mp3file = $ARGV[0];
my $imgfile = $ARGV[1];

my $mp3 = MP3::Tag->new($mp3file) or die "no file";
$mp3->get_tags;
my $id3v2 = $mp3->{ID3v2};

save_img($id3v2, $imgfile) if defined $imgfile;

$mp3->close();

sub save_img {
	my $id3v2 = shift;
	my $imgfile = shift;
	my $frameIDs_hash = $id3v2->get_frame_ids('truename');
	my $pic;

	$pic = $id3v2->get_frame("PIC") if $frameIDs_hash->{'PIC'};
	$pic = $id3v2->get_frame("APIC") if $frameIDs_hash->{'APIC'};

	open (SAVE, ">$imgfile");
	binmode SAVE;
	print SAVE $pic->{_Data};
	close SAVE;
}
