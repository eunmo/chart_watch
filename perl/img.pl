#!/usr/bin/perl
use MP3::Tag;

my $mp3file = $ARGV[0];
my $imgfile = $ARGV[1];

my $mp3 = MP3::Tag->new($mp3file) or die "no file";
$mp3->get_tags;
my $id3v2 = $mp3->{ID3v2};

save_img($id3v2, $imgfile) if defined $imgfile;

$mp3->close();

my $small = $imgfile;
$small =~ s/jpg$/50px\.jpg/;

system("convert $imgfile -resize 50 $small");

$small = $imgfile
$small =~ s/jpg$/30px\.jpg/;

system("convert $imgfile -resize 30 $small");

sub save_img {
	my $id3v2 = shift;
	my $imgfile = shift;

	my $pic = $id3v2->get_frame("APIC");
	open (SAVE, ">$imgfile");
	binmode SAVE;
	print SAVE $pic->{_Data};
	close SAVE;
}
